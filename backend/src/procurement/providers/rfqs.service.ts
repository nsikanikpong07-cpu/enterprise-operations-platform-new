import { BadRequestException, ForbiddenException, Injectable, NotFoundException, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { DataSource } from 'typeorm';
import { IamService } from '../../iam/providers/iam.service.js';
import { RfqNotificationsService } from './rfq-notifications.service.js';

type RfqInput = {
  title?: string; responseDeadline?: string;
  items?: Array<{ name?: string; type?: string; quantity?: number; unit?: string; scope?: string; location?: string }>;
  supplierIds?: string[];
};
type QuoteInput = { currency?: string; total?: number; proposedDate?: string; terms?: string; notes?: string; items?: Array<{ itemId?: string; unitPrice?: number }> };

@Injectable()
export class RfqsService implements OnModuleInit,OnModuleDestroy {
  private reminderTimer?:ReturnType<typeof setInterval>;
  private reminderBusy=false;
  constructor(private readonly db: DataSource, private readonly iam: IamService, private readonly notices: RfqNotificationsService) {}

  onModuleInit(){this.reminderTimer=setInterval(()=>void this.sendDueReminders(),60_000);this.reminderTimer.unref();}
  onModuleDestroy(){if(this.reminderTimer)clearInterval(this.reminderTimer);}

  private async sendDueReminders(){
    if(this.reminderBusy)return;this.reminderBusy=true;
    try{
      const due=await this.db.query(`SELECT i.id AS invite_id,i.supplier_id,r.id AS rfq_id,r.reference,r.title
        FROM procurement.rfq_invites i JOIN procurement.rfqs r ON r.id=i.rfq_id
        WHERE r.status='open' AND r.response_deadline>now() AND r.response_deadline<=now()+interval '24 hours'
          AND i.reminder_sent_at IS NULL AND NOT EXISTS(SELECT 1 FROM procurement.rfq_quotes q WHERE q.rfq_id=r.id AND q.supplier_id=i.supplier_id)
        ORDER BY r.response_deadline LIMIT 100`) as Array<{invite_id:string;supplier_id:string;rfq_id:string;reference:string;title:string}>;
      for(const notice of due){
        const claimed=await this.db.query('UPDATE procurement.rfq_invites SET reminder_sent_at=now() WHERE id=$1 AND reminder_sent_at IS NULL RETURNING id',[notice.invite_id]);
        if(!claimed.length)continue;
        await this.notices.send({rfqId:notice.rfq_id,supplierId:notice.supplier_id,type:'rfq_deadline_reminder',title:'RFQ response deadline approaching',reference:notice.reference,message:`The response deadline for "${notice.title}" is within 24 hours. Sign in to IMPRESSOR to submit a quotation or decline.`});
      }
    }catch{/* A later timer tick can retry reminders that were not claimed. */}
    finally{this.reminderBusy=false;}
  }

  private async company(userId: string, companyId: string) {
    if (!isUUID(companyId)) throw new BadRequestException('A valid company is required.');
    const membership = await this.iam.requireActiveCompanyMembership(userId, companyId);
    const permissions = await this.iam.permissionsForCompanyUser(membership.id);
    if (!['create_rfq', 'create_requisition', 'create_purchase_order', 'manage_catalog'].some((p) => permissions.includes(p))) {
      throw new ForbiddenException('Procurement access is required.');
    }
    return membership;
  }

  private async supplier(userId: string) {
    const rows = await this.db.query('SELECT supplier_id FROM vendor.supplier_accounts WHERE user_id=$1', [userId]) as Array<{ supplier_id: string }>;
    if (!rows[0]) throw new ForbiddenException('Supplier workspace access is required.');
    return rows[0].supplier_id;
  }

  async companyRequests(userId: string, companyId: string, status?: string) {
    await this.company(userId, companyId);
    const filter = status === 'open' || status === 'closed' ? status : null;
    return this.db.query(
      `SELECT r.id, r.reference, r.title, r.response_deadline,
        CASE WHEN r.status='open' AND r.response_deadline<=now() THEN 'closed' ELSE r.status END AS status, r.created_at,
        (SELECT count(*)::int FROM procurement.rfq_invites i WHERE i.rfq_id=r.id) AS invited_count,
        (SELECT count(*)::int FROM procurement.rfq_quotes q WHERE q.rfq_id=r.id AND q.status='submitted') AS quotation_count,
        (SELECT count(*)::int FROM procurement.rfq_quotes q WHERE q.rfq_id=r.id AND q.status='declined') AS declined_count,
        r.selected_quote_id, po.id AS draft_purchase_order_id, po.po_number
       FROM procurement.rfqs r LEFT JOIN procurement.rfq_purchase_orders po ON po.rfq_id=r.id
       WHERE r.company_id=$1 AND ($2::text IS NULL OR (CASE WHEN r.status='open' AND r.response_deadline<=now() THEN 'closed' ELSE r.status END)=$2)
       ORDER BY r.created_at DESC, r.id`, [companyId, filter],
    );
  }

  async create(userId: string, companyId: string, input: RfqInput) {
    const membership = await this.company(userId, companyId);
    const title = input.title?.trim();
    const items = input.items;
    const suppliers = [...new Set(input.supplierIds ?? [])];
    const deadline = input.responseDeadline ? new Date(input.responseDeadline) : null;
    if (!title || title.length > 200) throw new BadRequestException('Enter an RFQ title (up to 200 characters).');
    if (!deadline || Number.isNaN(deadline.getTime()) || deadline <= new Date()) throw new BadRequestException('Choose a response deadline in the future.');
    if (!Array.isArray(items) || items.length < 1 || items.length > 100) throw new BadRequestException('Add between 1 and 100 items or services.');
    if (!suppliers.length || suppliers.length > 100 || suppliers.some((id) => !isUUID(id))) throw new BadRequestException('Invite at least one valid supplier.');
    for (const item of items) {
      if (!item.name?.trim() || !['product', 'service'].includes(item.type ?? '') || !Number.isFinite(item.quantity) || Number(item.quantity) <= 0 || !item.unit?.trim() || !item.scope?.trim() || !item.location?.trim()) {
        throw new BadRequestException('Each RFQ line needs a name, type, positive quantity, unit, scope and location.');
      }
    }
    const rfq=await this.db.transaction(async (manager) => {
      const eligible = await manager.query(
        `SELECT s.id FROM vendor.suppliers s
         JOIN LATERAL (SELECT status, expires_at, verified_by, decision_source FROM vendor.verification_cases c
           WHERE COALESCE(c.supplier_id, (SELECT p.supplier_id FROM vendor.supplier_company_profiles p WHERE p.id=c.supplier_company_profile_id))=s.id
           ORDER BY c.opened_at DESC, c.id DESC LIMIT 1) v ON true
         WHERE s.id=ANY($1::uuid[]) AND s.status='active' AND v.status='approved'
           AND (v.verified_by IS NOT NULL OR v.decision_source='ocr_match')
           AND (v.expires_at IS NULL OR v.expires_at>now())`, [suppliers],
      ) as Array<{ id: string }>;
      if (eligible.length !== suppliers.length) throw new BadRequestException('Every invited supplier must have current platform verification.');
      const rows = await manager.query(
        `INSERT INTO procurement.rfqs (company_id, created_by_membership_id, title, response_deadline)
         VALUES ($1,$2,$3,$4) RETURNING id, reference, title, response_deadline, status`,
        [companyId, membership.id, title, deadline],
      ) as Array<{id:string;reference:string;title:string;response_deadline:Date;status:string}>;
      const rfq = rows[0];
      for (const item of items) await manager.query(
        `INSERT INTO procurement.rfq_items (rfq_id, name, item_type, quantity, unit, scope, location)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [rfq.id, item.name!.trim(), item.type, item.quantity, item.unit!.trim(), item.scope!.trim(), item.location!.trim()],
      );
      for (const supplierId of suppliers) await manager.query(
        'INSERT INTO procurement.rfq_invites (rfq_id, supplier_id) VALUES ($1,$2)', [rfq.id, supplierId],
      );
      return { ...rfq, invitedCount: suppliers.length };
    });
    // Persist each in-app invitation even if email is unavailable.
    for (const supplierId of suppliers) await this.notices.send({
      rfqId:String(rfq.id),supplierId,type:'rfq_invitation',title:'New quotation request',reference:String(rfq.reference),
      message:`Your business has been invited to respond to "${String(rfq.title)}". Review the scope and response deadline in your supplier workspace.`,
    });
    return rfq;
  }

  async supplierRequests(userId: string, status?: string) {
    const supplierId = await this.supplier(userId);
    const filter = status === 'open' || status === 'closed' ? status : null;
    return this.db.query(
      `SELECT r.id, r.reference, r.title, c.name AS buyer, r.response_deadline,
        CASE WHEN r.status='open' AND r.response_deadline<=now() THEN 'closed' ELSE r.status END AS status,
        q.status AS response_status, i.created_at AS invited_at
       FROM procurement.rfq_invites i JOIN procurement.rfqs r ON r.id=i.rfq_id
       JOIN organization.companies c ON c.id=r.company_id
       LEFT JOIN procurement.rfq_quotes q ON q.rfq_id=r.id AND q.supplier_id=i.supplier_id
       WHERE i.supplier_id=$1 AND ($2::text IS NULL OR (CASE WHEN r.status='open' AND r.response_deadline<=now() THEN 'closed' ELSE r.status END)=$2)
       ORDER BY i.created_at DESC`, [supplierId, filter],
    );
  }

  supplierNotifications(userId: string) { return this.notices.notifications(userId); }

  async markNotificationRead(userId: string, notificationId: string) {
    const result=await this.notices.markRead(userId,notificationId);
    if (!result) throw new NotFoundException('Notification not found.');
    return result;
  }

  async supplierRequest(userId: string, id: string) {
    const supplierId = await this.supplier(userId);
    const rows = await this.db.query(
      `SELECT r.id, r.reference, r.title, r.response_deadline, r.status, c.name AS buyer,
         i.supplier_id, q.status AS response_status, q.currency, q.total, q.proposed_date, q.terms, q.notes
       FROM procurement.rfq_invites i JOIN procurement.rfqs r ON r.id=i.rfq_id
       JOIN organization.companies c ON c.id=r.company_id
       LEFT JOIN procurement.rfq_quotes q ON q.rfq_id=r.id AND q.supplier_id=i.supplier_id
       WHERE r.id=$1 AND i.supplier_id=$2`, [id, supplierId],
    ) as Array<Record<string, unknown>>;
    if (!rows[0]) throw new NotFoundException('RFQ invitation not found.');
    const items = await this.db.query('SELECT id, name, item_type AS type, quantity, unit, scope, location FROM procurement.rfq_items WHERE rfq_id=$1 ORDER BY created_at,id', [id]);
    return { ...rows[0], items };
  }

  async decline(userId: string, id: string, reason: string) {
    const supplierId = await this.supplier(userId);
    const clean = reason.trim();
    if (!clean || clean.length > 500) throw new BadRequestException('Provide a decline reason (up to 500 characters).');
    return this.db.transaction(async (manager) => {
      const rows = await manager.query(`SELECT r.status,r.response_deadline,q.status AS quote_status FROM procurement.rfqs r JOIN procurement.rfq_invites i ON i.rfq_id=r.id LEFT JOIN procurement.rfq_quotes q ON q.rfq_id=r.id AND q.supplier_id=i.supplier_id WHERE r.id=$1 AND i.supplier_id=$2 FOR UPDATE OF r`, [id, supplierId]) as Array<{status:string; response_deadline:Date;quote_status?:string}>;
      if (!rows[0]) throw new NotFoundException('RFQ invitation not found.');
      if (rows[0].status !== 'open' || new Date(rows[0].response_deadline) <= new Date()) throw new BadRequestException('This RFQ is closed.');
      if (rows[0].quote_status === 'submitted') throw new BadRequestException('A submitted quotation cannot be declined.');
      await manager.query(`INSERT INTO procurement.rfq_quotes (rfq_id,supplier_id,status,decline_reason) VALUES ($1,$2,'declined',$3)
        ON CONFLICT (rfq_id,supplier_id) DO UPDATE SET status='declined',decline_reason=EXCLUDED.decline_reason,updated_at=now()`, [id,supplierId,clean]);
      return { status: 'declined' };
    });
  }

  async submitQuotation(userId: string, id: string, input: QuoteInput) {
    const supplierId = await this.supplier(userId);
    let total = Number(input.total);
    const currency = (input.currency ?? 'NGN').trim().toUpperCase();
    const terms = input.terms?.trim();
    const proposedDate = input.proposedDate ? new Date(input.proposedDate) : null;
    if (!/^[A-Z]{3}$/.test(currency) || !terms || terms.length > 2000 || !proposedDate || Number.isNaN(proposedDate.getTime())) throw new BadRequestException('Enter a valid currency, proposed date and quotation terms.');
    if (!Array.isArray(input.items) || !input.items.length || input.items.some(item=>!isUUID(item.itemId??'')||!Number.isFinite(item.unitPrice)||Number(item.unitPrice)<=0)) throw new BadRequestException('Enter a unit price for every requested line.');
    const saved=await this.db.transaction(async (manager) => {
      const rows = await manager.query(`SELECT r.status,r.response_deadline FROM procurement.rfqs r JOIN procurement.rfq_invites i ON i.rfq_id=r.id WHERE r.id=$1 AND i.supplier_id=$2 FOR UPDATE OF r`, [id, supplierId]) as Array<{status:string; response_deadline:Date}>;
      if (!rows[0]) throw new NotFoundException('RFQ invitation not found.');
      if (rows[0].status !== 'open' || new Date(rows[0].response_deadline) <= new Date()) throw new BadRequestException('This RFQ is closed.');
      const rfqItems=await manager.query('SELECT id,quantity FROM procurement.rfq_items WHERE rfq_id=$1',[id]) as Array<{id:string;quantity:string}>;
      if(rfqItems.length!==input.items!.length||rfqItems.some(line=>!input.items!.some(item=>item.itemId===line.id))) throw new BadRequestException('Provide one price for every RFQ line, with no duplicate lines.');
      total=Math.round(rfqItems.reduce((sum,line)=>sum+Number(line.quantity)*Number(input.items!.find(item=>item.itemId===line.id)!.unitPrice),0)*100)/100;
      if(!Number.isFinite(total)||total<=0) throw new BadRequestException('Quotation total must be greater than zero.');
      const quotes=await manager.query(`INSERT INTO procurement.rfq_quotes (rfq_id,supplier_id,status,currency,total,proposed_date,terms,notes,submitted_at)
        VALUES ($1,$2,'submitted',$3,$4,$5,$6,$7,now()) ON CONFLICT (rfq_id,supplier_id) DO UPDATE SET status='submitted',currency=EXCLUDED.currency,total=EXCLUDED.total,proposed_date=EXCLUDED.proposed_date,terms=EXCLUDED.terms,notes=EXCLUDED.notes,decline_reason=NULL,submitted_at=now(),updated_at=now() RETURNING id`,
      [id,supplierId,currency,total,proposedDate,terms,input.notes?.trim() || null]) as Array<{id:string}>;
      await manager.query('DELETE FROM procurement.rfq_quote_items WHERE quote_id=$1',[quotes[0].id]);
      for(const item of input.items!){
        const rfqItem=rfqItems.find(line=>line.id===item.itemId)!;
        const lineTotal=Math.round(Number(rfqItem.quantity)*Number(item.unitPrice)*100)/100;
        await manager.query('INSERT INTO procurement.rfq_quote_items(quote_id,rfq_item_id,unit_price,line_total) VALUES($1,$2,$3,$4)',[quotes[0].id,item.itemId,item.unitPrice,lineTotal]);
      }
      return { status: 'submitted', submittedAt: new Date().toISOString() };
    });
    const request=await this.db.query('SELECT reference,title FROM procurement.rfqs WHERE id=$1',[id]) as Array<{reference:string;title:string}>;
    await this.notices.send({rfqId:id,supplierId,type:'quotation_submitted',title:'Quotation submitted',reference:request[0].reference,message:`Your quotation for "${request[0].title}" was submitted successfully. The buyer can review it in IMPRESSOR.`});
    return saved;
  }

  async quotations(userId: string, id: string) {
    const row = await this.db.query('SELECT company_id FROM procurement.rfqs WHERE id=$1', [id]) as Array<{company_id:string}>;
    if (!row[0]) throw new NotFoundException('RFQ not found.');
    await this.company(userId, row[0].company_id);
    return this.db.query(`SELECT s.id AS supplier_id,COALESCE(NULLIF(s.trading_name,''),s.legal_name) AS supplier_name,
      q.id AS quote_id,q.status,q.currency,q.total,q.proposed_date,q.terms,q.notes,q.decline_reason,q.submitted_at,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('rfqItemId',qi.rfq_item_id,'name',ri.name,'quantity',ri.quantity,'unit',ri.unit,'unitPrice',qi.unit_price,'lineTotal',qi.line_total) ORDER BY ri.created_at)
        FROM procurement.rfq_quote_items qi JOIN procurement.rfq_items ri ON ri.id=qi.rfq_item_id WHERE qi.quote_id=q.id),'[]'::jsonb) AS items
      FROM procurement.rfq_invites i JOIN vendor.suppliers s ON s.id=i.supplier_id
      LEFT JOIN procurement.rfq_quotes q ON q.rfq_id=i.rfq_id AND q.supplier_id=i.supplier_id
      WHERE i.rfq_id=$1 ORDER BY q.submitted_at NULLS LAST,s.legal_name`, [id]);
  }

  async selectQuote(userId: string, companyId: string, id: string, quoteId: string) {
    const membership = await this.company(userId, companyId);
    if (!isUUID(quoteId)) throw new BadRequestException('A valid quotation is required.');
    const result=await this.db.transaction(async manager=>{
      const rfqs=await manager.query(`SELECT id,reference,title,status,response_deadline FROM procurement.rfqs WHERE id=$1 AND company_id=$2 FOR UPDATE`,[id,companyId]) as Array<{id:string;reference:string;title:string;status:string;response_deadline:Date}>;
      if(!rfqs[0]) throw new NotFoundException('RFQ not found.');
      if(rfqs[0].status!=='open'||new Date(rfqs[0].response_deadline)<=new Date()) throw new BadRequestException('This RFQ is closed.');
      const quotes=await manager.query(`SELECT q.id,q.supplier_id,q.currency,q.total,q.proposed_date,q.terms FROM procurement.rfq_quotes q JOIN procurement.rfq_invites i ON i.rfq_id=q.rfq_id AND i.supplier_id=q.supplier_id WHERE q.id=$1 AND q.rfq_id=$2 AND q.status='submitted' FOR UPDATE`,[quoteId,id]) as Array<{id:string;supplier_id:string;currency:string;total:string;proposed_date:Date;terms:string}>;
      if(!quotes[0]) throw new BadRequestException('Choose a submitted quotation for this RFQ.');
      const eligible=await manager.query(`SELECT 1 FROM vendor.suppliers s JOIN LATERAL(SELECT status,expires_at,verified_by,decision_source FROM vendor.verification_cases c WHERE COALESCE(c.supplier_id,(SELECT p.supplier_id FROM vendor.supplier_company_profiles p WHERE p.id=c.supplier_company_profile_id))=s.id ORDER BY c.opened_at DESC,c.id DESC LIMIT 1)v ON true WHERE s.id=$1 AND s.status='active' AND v.status='approved' AND (v.verified_by IS NOT NULL OR v.decision_source='ocr_match') AND (v.expires_at IS NULL OR v.expires_at>now())`,[quotes[0].supplier_id]);
      if(!eligible.length) throw new BadRequestException('The selected supplier must have current platform verification.');
      await manager.query(`UPDATE procurement.rfqs SET status='closed',closed_at=now(),closed_by_membership_id=$2,close_reason='selected_quote',selected_quote_id=$3 WHERE id=$1`,[id,membership.id,quoteId]);
      const lines=await manager.query(`SELECT ri.id,ri.name,ri.item_type,ri.quantity,ri.unit,ri.scope,ri.location,qi.unit_price,qi.line_total FROM procurement.rfq_quote_items qi JOIN procurement.rfq_items ri ON ri.id=qi.rfq_item_id WHERE qi.quote_id=$1 ORDER BY ri.created_at`,[quoteId]);
      const poNumber=`PO-${rfqs[0].reference}`;
      const purchaseOrders=await manager.query(`INSERT INTO procurement.rfq_purchase_orders(po_number,rfq_id,quote_id,company_id,supplier_id,buyer_membership_id,currency,total_amount,proposed_date,terms,items_snapshot)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb) RETURNING id,po_number,status,total_amount,currency`,[poNumber,id,quoteId,companyId,quotes[0].supplier_id,membership.id,quotes[0].currency,quotes[0].total,quotes[0].proposed_date,quotes[0].terms,JSON.stringify(lines)]);
      return {rfq:rfqs[0],supplierId:quotes[0].supplier_id,purchaseOrder:purchaseOrders[0]};
    });
    await this.notifyClosed(id,result.rfq.reference,result.rfq.title,result.supplierId);
    return result.purchaseOrder;
  }

  async close(userId: string, companyId: string, id: string) {
    const membership = await this.company(userId, companyId);
    const rfqs=await this.db.query(`UPDATE procurement.rfqs SET status='closed',closed_at=now(),closed_by_membership_id=$3,close_reason='buyer_closed'
      WHERE id=$1 AND company_id=$2 AND status='open' RETURNING id,reference,title`,[id,companyId,membership.id]) as Array<{id:string;reference:string;title:string}>;
    if(!rfqs[0]) throw new NotFoundException('Open RFQ not found.');
    await this.notifyClosed(id,rfqs[0].reference,rfqs[0].title,null);
    return {id,reference:rfqs[0].reference,status:'closed',closeReason:'buyer_closed'};
  }

  private async notifyClosed(id:string,reference:string,title:string,selectedSupplierId:string|null) {
    const invites=await this.db.query(`SELECT i.supplier_id,q.status AS response_status,r.response_deadline FROM procurement.rfq_invites i JOIN procurement.rfqs r ON r.id=i.rfq_id LEFT JOIN procurement.rfq_quotes q ON q.rfq_id=i.rfq_id AND q.supplier_id=i.supplier_id WHERE i.rfq_id=$1`,[id]) as Array<{supplier_id:string;response_status?:string;response_deadline:Date}>;
    const early=new Date(invites[0]?.response_deadline ?? Date.now())>new Date();
    for(const invite of invites){
      const winner=selectedSupplierId===invite.supplier_id;
      let message:string;
      if(winner) message=`The buyer selected your quotation for “${title}”. A purchase order draft has been prepared for the buyer to review.`;
      else if(selectedSupplierId&&invite.response_status==='submitted') message=`The RFQ closed early and the buyer selected another quotation. Thank you for responding to “${title}”.`;
      else if(selectedSupplierId) message=`The RFQ “${title}” closed early before the deadline. The buyer selected another quotation.`;
      else if(invite.response_status==='submitted') message=`The buyer closed “${title}”${early?' before the deadline':''}. Thank you for submitting your quotation.`;
      else message=`The buyer closed “${title}”${early?' before the original deadline':''}. No supplier was selected.`;
      await this.notices.send({rfqId:id,supplierId:invite.supplier_id,type:winner?'quotation_selected':'rfq_closed',title:winner?'Quotation selected':'RFQ closed',message,reference});
    }
  }

  async purchaseOrder(userId:string,id:string){
    const row = await this.db.query('SELECT company_id FROM procurement.rfqs WHERE id=$1', [id]) as Array<{company_id:string}>;
    if (!row[0]) throw new NotFoundException('RFQ not found.');
    await this.company(userId, row[0].company_id);
    const orders=await this.db.query(`SELECT po.*,COALESCE(NULLIF(s.trading_name,''),s.legal_name) AS supplier_name FROM procurement.rfq_purchase_orders po JOIN vendor.suppliers s ON s.id=po.supplier_id WHERE po.rfq_id=$1`,[id]);
    return orders[0]??null;
  }
}
