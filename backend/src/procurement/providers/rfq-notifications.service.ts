import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { DataSource } from 'typeorm';

type RfqNotice = { rfqId: string; supplierId: string; type: string; title: string; message: string; reference: string };

@Injectable()
export class RfqNotificationsService {
  private readonly logger = new Logger(RfqNotificationsService.name);
  constructor(private readonly db: DataSource, private readonly config: ConfigService) {}

  async send(notice: RfqNotice): Promise<void> {
    try {
    const contacts = await this.db.query(`SELECT email FROM vendor.supplier_contacts WHERE supplier_id=$1 AND is_primary=true LIMIT 1`, [notice.supplierId]) as Array<{email?: string | null}>;
    const email = contacts[0]?.email?.trim() || null;
    const rows = await this.db.query(`INSERT INTO procurement.rfq_notifications
      (rfq_id,supplier_id,notification_type,title,message,email_to,email_status)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [notice.rfqId,notice.supplierId,notice.type,notice.title,notice.message,email,email ? 'pending' : 'not_available']) as Array<{id:string}>;
    if (!email) return;

    const host=this.config.get<string>('SMTP_HOST');
    const user=this.config.get<string>('SMTP_USER');
    const password=this.config.get<string>('SMTP_PASSWORD');
    const from=this.config.get<string>('SMTP_FROM');
    const port=Number(this.config.get<string>('SMTP_PORT') ?? '587');
    if (!host || !user || !password || !from || /[\r\n]/.test(from) || ![465,587].includes(port)) {
      await this.db.query(`UPDATE procurement.rfq_notifications SET email_status='failed' WHERE id=$1`,[rows[0].id]);
      return;
    }
    try {
      const linkBase=this.config.get<string>('FRONTEND_PUBLIC_URL')?.replace(/\/$/,'');
      const link=linkBase ? `\n\nView the request: ${linkBase}/supplier-workspace/requests/${notice.rfqId}` : '';
      const transport=nodemailer.createTransport({host,port,secure:port===465,requireTLS:true,auth:{user,pass:password},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:30000,logger:false,debug:false});
      try {
        await transport.sendMail({from,to:email,subject:`${notice.reference}: ${notice.title}`,text:`${notice.message}\n\nSign in to IMPRESSOR to view the RFQ.${link}`});
      } finally { transport.close(); }
      await this.db.query(`UPDATE procurement.rfq_notifications SET email_status='sent' WHERE id=$1`,[rows[0].id]);
    } catch {
      this.logger.warn('RFQ notification email failed; the in-app notification remains available.');
      await this.db.query(`UPDATE procurement.rfq_notifications SET email_status='failed' WHERE id=$1`,[rows[0].id]);
    }
    } catch {
      this.logger.error('RFQ notification could not be stored.');
    }
  }

  async notifications(userId: string) {
    return this.db.query(`SELECT n.id,n.rfq_id,n.notification_type,n.title,n.message,n.email_status,n.read_at,n.created_at
      FROM procurement.rfq_notifications n JOIN vendor.supplier_accounts a ON a.supplier_id=n.supplier_id
      WHERE a.user_id=$1 ORDER BY n.created_at DESC LIMIT 100`,[userId]);
  }

  async markRead(userId: string, notificationId: string) {
    const rows = await this.db.query(`UPDATE procurement.rfq_notifications n SET read_at=COALESCE(read_at,now())
      FROM vendor.supplier_accounts a WHERE n.id=$1 AND a.user_id=$2 AND a.supplier_id=n.supplier_id RETURNING n.id,n.read_at`,[notificationId,userId]);
    return rows[0] ?? null;
  }
}
