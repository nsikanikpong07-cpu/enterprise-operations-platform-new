import { BadRequestException, ForbiddenException, Injectable, NotFoundException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { DataSource } from 'typeorm';
import { IamService } from '../../iam/providers/iam.service.js';
import { VendorHubController } from '../../vendor/controllers/vendor-hub.controller.js';
import { JwtAuthGuard, type AuthenticatedRequest } from './jwt-auth.guard.js';

@Injectable()
export class VendorHubAccessGuard implements CanActivate {
  constructor(private readonly jwt: JwtAuthGuard, private readonly db: DataSource, private readonly iam: IamService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getClass() !== VendorHubController) return true;
    await this.jwt.canActivate(context);
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const memberships = await this.db.query('SELECT id,company_id FROM iam.company_users WHERE user_id=$1 AND status=\'active\' ORDER BY is_primary DESC, created_at ASC LIMIT 1', [req.user.id]) as Array<{ id: string; company_id: string }>;
    if (!memberships.length) throw new ForbiddenException('Active company membership is required');
    const membership = memberships[0];
    const queryCompany = req.query.companyId;
    if (queryCompany !== undefined && queryCompany !== membership.company_id) throw new ForbiddenException('Company does not match membership');
    if (req.body && typeof req.body === 'object' && (req.body as Record<string, unknown>).companyId !== undefined && (req.body as Record<string, unknown>).companyId !== membership.company_id) throw new ForbiddenException('Company does not match membership');
    const method = req.method.toUpperCase();
    const permissions = await this.iam.permissionsForCompanyUser(membership.id);
    if (method === 'GET') {
      if (!['manage_catalog','create_requisition','create_purchase_order'].some((p) => permissions.includes(p))) throw new ForbiddenException('Vendor Hub access is required');
    } else if (!['manage_catalog','create_requisition','create_purchase_order'].some((p) => permissions.includes(p))) {
      throw new ForbiddenException('Vendor Hub access is required');
    }
    const action = context.getHandler().name;
    if (['addSupplier','updateRelationship'].includes(action) && !['manage_catalog','create_requisition','create_purchase_order'].some((p) => permissions.includes(p))) throw new ForbiddenException('Supplier relationship access is required');
    if (action === 'updateRelationship') {
      const id = req.params.profileId;
      if (!id || !isUUID(id)) throw new BadRequestException('profileId must be a valid UUID');
      const found = await this.db.query('SELECT id FROM vendor.supplier_company_profiles WHERE id=$1 AND company_id=$2', [id, membership.company_id]);
      if (!found.length) throw new NotFoundException('Supplier relationship not found');
    }
    req.query.companyId = membership.company_id;
    return true;
  }
}
