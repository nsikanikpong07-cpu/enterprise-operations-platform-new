import { BadRequestException, ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { DataSource } from "typeorm";
import { isUUID } from "class-validator";
import { IamService } from "../../iam/providers/iam.service.js";
import { RequisitionsController } from "../../procurement/controllers/requisitions.controller.js";
import { ProcurementController } from "../../procurement/controllers/procurement.controller.js";
import { ApprovalsController } from "../../procurement/controllers/approvals.controller.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import type { CompanyAuthenticatedRequest } from "./company-access.guard.js";

/** Fail closed while procurement write and order policies are being developed. */
@Injectable()
export class ProcurementReadGuard implements CanActivate {
  constructor(private readonly jwt: JwtAuthGuard, private readonly iam: IamService, private readonly db: DataSource) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const controller = context.getClass();
    if (![RequisitionsController, ProcurementController, ApprovalsController].includes(controller)) return true;
    await this.jwt.canActivate(context);
    const req = context.switchToHttp().getRequest<CompanyAuthenticatedRequest>();
    const action = context.getHandler().name;
    if (controller === RequisitionsController && ["findOne", "itemsFor"].includes(action) && req.method === "GET") {
      const id = req.params.id;
      if (typeof id !== "string" || !isUUID(id)) throw new BadRequestException("A valid requisition is required.");
      const rows = await this.db.query("SELECT company_id FROM procurement.requisitions WHERE id=$1", [id]);
      if (!rows.length) throw new ForbiddenException("Requisition is unavailable.");
      const membership = await this.iam.requireActiveCompanyMembership(req.user.id, rows[0].company_id);
      const permissions = await this.iam.permissionsForCompanyUser(membership.id);
      if (!["create_requisition", "approve_requisition", "create_purchase_order"].some(permission => permissions.includes(permission))) throw new ForbiddenException("Requisition access is required.");
      req.companyMembership = membership;
      return true;
    }
    if (controller === RequisitionsController && ((["submit", "cancel"].includes(action) && req.method === "POST") || (action === "update" && req.method === "PATCH"))) {
      const id = req.params.id;
      if (typeof id !== "string" || !isUUID(id)) throw new BadRequestException("A valid requisition is required.");
      const rows = await this.db.query("SELECT company_id,requester_id FROM procurement.requisitions WHERE id=$1", [id]);
      if (!rows.length) throw new ForbiddenException("Requisition is unavailable.");
      const membership = await this.iam.requireActiveCompanyMembership(req.user.id, rows[0].company_id);
      if (rows[0].requester_id !== membership.id) throw new ForbiddenException("Only the requester can change this requisition.");
      const permissions = await this.iam.permissionsForCompanyUser(membership.id);
      if (!permissions.includes("create_requisition")) throw new ForbiddenException("Requisition creation permission is required.");
      req.companyMembership = membership;
      if (action === 'update') {
        const body = req.body as Record<string, unknown> | undefined;
        if (!body || !Array.isArray(body.items) || !body.items.length) throw new BadRequestException('At least one item is required.');
        if (body.departmentId != null) {
          if (typeof body.departmentId !== 'string' || !isUUID(body.departmentId)) throw new BadRequestException('Invalid department.');
          const departments = await this.db.query('SELECT id FROM organization.departments WHERE id=$1 AND company_id=$2', [body.departmentId, rows[0].company_id]);
          if (!departments.length) throw new ForbiddenException('Department is unavailable.');
        }
        for (const entry of body.items) {
          if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new BadRequestException('Invalid requisition item.');
          const item = entry as Record<string, unknown>;
          if (typeof item.itemId !== 'string' || !isUUID(item.itemId) || typeof item.unitOfMeasureId !== 'string' || !isUUID(item.unitOfMeasureId)) throw new BadRequestException('A valid item and unit are required.');
          const products = await this.db.query('SELECT id FROM catalog.items WHERE id=$1 AND company_id=$2 AND is_active=true', [item.itemId, rows[0].company_id]);
          if (!products.length) throw new ForbiddenException('Catalog item is unavailable.');
          const units = await this.db.query('SELECT allows_fractional FROM catalog.units_of_measure WHERE id=$1', [item.unitOfMeasureId]);
          if (!units.length) throw new BadRequestException('Unit of measure is unavailable.');
          if (typeof item.quantityRequested === 'number' && !Number.isInteger(item.quantityRequested) && units[0].allows_fractional !== true) throw new BadRequestException('This unit requires a whole-number quantity or has no fractional policy configured.');
        }
      }
      return true;
    }
    if (controller === ProcurementController) {
      const body = req.body as Record<string, unknown> | undefined;
      const list = ["findOrders", "eligibleSuppliers", "findReceipts"].includes(action) && req.method === "GET";
      const readReceipt = action === "findReceipt" && req.method === "GET";
      const readOrder = ["findOrder", "orderItems", "receiptsForOrder"].includes(action) && req.method === "GET";
      const makeOrder = action === "createOrder" && req.method === "POST";
      const issueOrder = action === "issueOrder" && req.method === "POST";
      const makeReceipt = action === "createReceipt" && req.method === "POST";
      if (!list && !readOrder && !readReceipt && !makeOrder && !issueOrder && !makeReceipt) throw new ForbiddenException("This procurement action is not yet available.");
      let companyId: unknown = list ? req.query.companyId : makeOrder ? body?.companyId : undefined;
      if (readReceipt) {
        const id = req.params.id;
        if (typeof id !== 'string' || !isUUID(id)) throw new BadRequestException('A valid goods receipt is required.');
        const rows = await this.db.query('SELECT po.company_id FROM procurement.goods_receipts gr JOIN procurement.purchase_orders po ON po.id=gr.purchase_order_id WHERE gr.id=$1', [id]);
        if (!rows.length) throw new ForbiddenException('Goods receipt is unavailable.');
        companyId = rows[0].company_id;
      }
      if (readOrder || issueOrder || makeReceipt) {
        const orderId = readOrder || issueOrder ? req.params.id : body?.purchaseOrderId;
        if (typeof orderId !== "string" || !isUUID(orderId)) throw new BadRequestException("A valid purchase order is required.");
        const rows = await this.db.query("SELECT company_id FROM procurement.purchase_orders WHERE id=$1", [orderId]);
        if (!rows.length) throw new ForbiddenException("Purchase order is unavailable.");
        companyId = rows[0].company_id;
      }
      if (typeof companyId !== "string" || !isUUID(companyId)) throw new BadRequestException("A valid company is required.");
      const membership = await this.iam.requireActiveCompanyMembership(req.user.id, companyId);
      req.companyMembership = membership;
      if (list || readOrder || readReceipt) {
        const permissions = await this.iam.permissionsForCompanyUser(membership.id);
        const required = action === "eligibleSuppliers" ? ["create_purchase_order"] : ["create_purchase_order", "receive_goods"];
        if (!required.some(permission => permissions.includes(permission))) throw new ForbiddenException("Purchase order access is required.");
      }
      if (readOrder && action === 'findOrder') {
        const permissions = await this.iam.permissionsForCompanyUser(membership.id);
        const contextRequest = req as CompanyAuthenticatedRequest & { canIssueOrder?: boolean; canReceiveGoods?: boolean };
        contextRequest.canIssueOrder = permissions.includes('create_purchase_order');
        contextRequest.canReceiveGoods = permissions.includes('receive_goods');
      }
      if (makeOrder || issueOrder || makeReceipt) {
        const permissions = await this.iam.permissionsForCompanyUser(membership.id);
        const required = makeOrder || issueOrder ? "create_purchase_order" : "receive_goods";
        if (!permissions.includes(required)) throw new ForbiddenException("You do not have permission for this action.");
        if (!body && !issueOrder) throw new BadRequestException("Invalid request.");
        if (issueOrder) return true;
        if (!body) throw new BadRequestException("Invalid request.");
        if (makeOrder) body.buyerId = membership.id;
        else body.receivedById = membership.id;
      }
      return true;
    }
    if (controller === ApprovalsController && action === "pendingForSelf" && req.method === "GET") {
      const companyId = req.query.companyId;
      if (typeof companyId !== "string" || !isUUID(companyId)) throw new BadRequestException("A valid company is required.");
      const membership = await this.iam.requireActiveCompanyMembership(req.user.id, companyId);
      const permissions = await this.iam.permissionsForCompanyUser(membership.id);
      if (!permissions.includes("approve_requisition")) throw new ForbiddenException("Requisition approval permission is required.");
      req.companyMembership = membership;
      return true;
    }
    if (controller === ApprovalsController && action === "decideRequisition" && req.method === "POST") {
      const id = req.params.id;
      if (typeof id !== "string" || !isUUID(id)) throw new BadRequestException("A valid requisition is required.");
      const rows = await this.db.query("SELECT company_id, requester_id FROM procurement.requisitions WHERE id=$1", [id]);
      if (!rows.length) throw new ForbiddenException("Requisition is unavailable.");
      const membership = await this.iam.requireActiveCompanyMembership(req.user.id, rows[0].company_id);
      if (membership.id === rows[0].requester_id) throw new ForbiddenException("You cannot approve your own requisition.");
      const permissions = await this.iam.permissionsForCompanyUser(membership.id);
      if (!permissions.includes("approve_requisition")) throw new ForbiddenException("Requisition approval permission is required.");
      req.companyMembership = membership;
      return true;
    }
    if (controller === ApprovalsController) {
      const body = req.body as Record<string, unknown> | undefined;
      const isAssign = action === "create" && req.method === "POST";
      const isList = action === "forRequisition" && req.method === "GET";
      const isPending = action === "pendingFor" && req.method === "GET";
      const isDecide = action === "decide" && req.method === "PATCH";
      if (isAssign || isPending || isDecide) throw new ForbiddenException("Individual approval assignments are no longer available.");
      if (!isAssign && !isList && !isPending && !isDecide) throw new ForbiddenException("This procurement action is not yet available.");
      const id = isAssign ? body?.requisitionId : isList ? req.query.requisitionId : isPending ? req.query.approverId : req.params.id;
      if (typeof id !== "string" || !isUUID(id)) throw new BadRequestException("A valid record ID is required.");
      const sql = isPending
        ? "SELECT id,company_id FROM iam.company_users WHERE id=$1"
        : isDecide
          ? "SELECT r.company_id, a.approver_id FROM procurement.approvals a JOIN procurement.requisitions r ON r.id=a.requisition_id WHERE a.id=$1"
          : "SELECT company_id FROM procurement.requisitions WHERE id=$1";
      const rows = await this.db.query(sql, [id]);
      if (!rows.length) throw new ForbiddenException("Approval record is unavailable.");
      const membership = await this.iam.requireActiveCompanyMembership(req.user.id, rows[0].company_id);
      req.companyMembership = membership;
      const permissions = await this.iam.permissionsForCompanyUser(membership.id);
      if (isList && !["create_requisition", "approve_requisition", "create_purchase_order"].some(permission => permissions.includes(permission))) throw new ForbiddenException("Requisition access is required.");
      if (isAssign) {
        if (!permissions.includes("manage_iam")) throw new ForbiddenException("Company administrator permission is required to assign approvers.");
        const approverId = body?.approverId;
        if (typeof approverId !== "string" || !isUUID(approverId)) throw new BadRequestException("A valid approver is required.");
        const approver = await this.db.query("SELECT id FROM iam.company_users WHERE id=$1 AND company_id=$2 AND status='active'", [approverId, rows[0].company_id]);
        if (!approver.length) throw new ForbiddenException("Approver is unavailable.");
        const approverPermissions = await this.iam.permissionsForCompanyUser(approverId);
        if (!approverPermissions.includes("approve_requisition")) throw new ForbiddenException("The selected staff member does not have approval permission.");
      }
      if ((isPending && id !== membership.id) || (isDecide && rows[0].approver_id !== membership.id)) throw new ForbiddenException("This approval is assigned to another staff member.");
      if ((isPending || isDecide) && !permissions.includes("approve_requisition")) throw new ForbiddenException("Requisition approval permission is required.");
      return true;
    }
    if (controller !== RequisitionsController || !((action === "findAll" && req.method === "GET") || (action === "create" && req.method === "POST"))) throw new ForbiddenException("This procurement action is not yet available.");
    const body = req.body as Record<string, unknown> | undefined;
    const companyId = action === "create" ? body?.companyId : req.query.companyId;
    if (typeof companyId !== "string" || !isUUID(companyId)) throw new BadRequestException("companyId must be a valid UUID");
    const membership = await this.iam.requireActiveCompanyMembership(req.user.id, companyId);
    req.companyMembership = membership;
    if (action === "findAll") {
      const permissions = await this.iam.permissionsForCompanyUser(membership.id);
      if (!["create_requisition", "approve_requisition", "create_purchase_order"].some(permission => permissions.includes(permission))) throw new ForbiddenException("Requisition access is required.");
    }
    if (action === "create") {
      const permissions = await this.iam.permissionsForCompanyUser(membership.id);
      if (!permissions.includes("create_requisition")) throw new ForbiddenException("Requisition creation permission is required.");
      if (!body) throw new BadRequestException("Invalid request.");
      body.requesterId = membership.id;
      if (body.departmentId != null) {
        if (typeof body.departmentId !== "string" || !isUUID(body.departmentId)) throw new BadRequestException("Invalid department.");
        const rows = await this.db.query("SELECT id FROM organization.departments WHERE id=$1 AND company_id=$2",[body.departmentId,companyId]);
        if (!rows.length) throw new ForbiddenException("Department is unavailable.");
      }
      if (!Array.isArray(body.items) || !body.items.length) throw new BadRequestException("At least one item is required.");
      for (const value of body.items) {
        if (!value || typeof value !== "object" || Array.isArray(value)) throw new BadRequestException("Invalid requisition item.");
        const item = value as Record<string, unknown>;
        if (typeof item.itemId !== "string" || !isUUID(item.itemId)) throw new BadRequestException("Invalid item.");
        const found = await this.db.query("SELECT id FROM catalog.items WHERE id=$1 AND company_id=$2 AND is_active=true",[item.itemId,companyId]);
        if (!found.length) throw new ForbiddenException("Catalog item is unavailable.");
        if (typeof item.unitOfMeasureId !== 'string' || !isUUID(item.unitOfMeasureId)) throw new BadRequestException('A valid unit of measure is required.');
        const units = await this.db.query('SELECT allows_fractional FROM catalog.units_of_measure WHERE id=$1', [item.unitOfMeasureId]);
        if (!units.length) throw new BadRequestException('Unit of measure is unavailable.');
        if (typeof item.quantityRequested === 'number' && !Number.isInteger(item.quantityRequested) && units[0].allows_fractional !== true)
          throw new BadRequestException('This unit requires a whole-number quantity or has no fractional policy configured.');
      }
    }
    return true;
  }
}
