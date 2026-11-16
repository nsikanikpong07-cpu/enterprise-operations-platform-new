import { BadRequestException, ForbiddenException, Injectable, NotFoundException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { isUUID } from 'class-validator';
import { CatalogController } from '../../catalog/controllers/catalog.controller.js';
import { ItemsController } from '../../catalog/controllers/items.controller.js';
import { IamService } from '../../iam/providers/iam.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { CompanyAuthenticatedRequest } from './company-access.guard.js';

@Injectable()
export class CatalogAccessGuard implements CanActivate {
  constructor(private readonly jwt: JwtAuthGuard, private readonly iam: IamService, private readonly db: DataSource) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const controller = context.getClass();
    if (controller !== CatalogController && controller !== ItemsController) return true;
    await this.jwt.canActivate(context);
    const req = context.switchToHttp().getRequest<CompanyAuthenticatedRequest>();
    const action = context.getHandler().name;
    // Shared unit creation belongs to the platform team, not company users.
    if (controller === CatalogController && action === 'createUnit') throw new ForbiddenException('Shared units are managed by the platform');
    const membershipRows = await this.db.query('SELECT company_id FROM iam.company_users WHERE user_id = $1', [req.user.id]);
    if (!membershipRows[0]) throw new ForbiddenException('Company membership is required');
    const companyId: string = membershipRows[0].company_id;
    const membership = await this.iam.requireActiveCompanyMembership(req.user.id, companyId);
    const queryCompany = req.query.companyId;
    if (queryCompany !== undefined && queryCompany !== companyId) throw new ForbiddenException('Company does not match membership');
    const body = req.body as Record<string, unknown> | undefined;
    if (body?.companyId !== undefined && body.companyId !== companyId) throw new ForbiddenException('Company does not match membership');
    const known = controller === ItemsController ? ['findAll','findOne','create','update'] : ['findCategories','findCategory','createCategory','updateCategory','removeCategory','findUnits'];
    if (!known.includes(action)) throw new ForbiddenException('Catalog access policy is not configured');
    if (['findOne','update','remove','findCategory','updateCategory','removeCategory'].includes(action)) {
      const id = req.params.id;
      if (typeof id !== 'string' || !isUUID(id)) throw new BadRequestException('id must be a valid UUID');
      const table = controller === ItemsController ? 'catalog.items' : 'catalog.item_categories';
      const rows = await this.db.query(`SELECT id FROM ${table} WHERE id = $1 AND company_id = $2`, [id, companyId]);
      if (!rows[0]) throw new NotFoundException('Catalog record not found');
    }
    for (const key of ['categoryId','parentId']) {
      const ref = body?.[key];
      if (ref == null) continue;
      if (typeof ref !== 'string' || !isUUID(ref)) throw new BadRequestException(`${key} must be a valid UUID`);
      const rows = await this.db.query('SELECT id FROM catalog.item_categories WHERE id = $1 AND company_id = $2', [ref, companyId]);
      if (!rows[0]) throw new NotFoundException('Category not found');
    }
    if (controller === CatalogController && action === 'updateCategory' && typeof body?.parentId === 'string') {
      const rows = await this.db.query(`WITH RECURSIVE descendants AS (
        SELECT id FROM catalog.item_categories WHERE id = $1 AND company_id = $3
        UNION SELECT c.id FROM catalog.item_categories c JOIN descendants d ON c.parent_id = d.id WHERE c.company_id = $3
      ) SELECT id FROM descendants WHERE id = $2`, [req.params.id, body.parentId, companyId]);
      if (rows.length) throw new BadRequestException('A category cannot be its own parent or a descendant of itself');
    }
    if (req.method === 'GET') {
      const permissions = await this.iam.permissionsForCompanyUser(membership.id);
      // Requesters and buyers need read-only catalog data for procurement forms.
      if (!['manage_catalog', 'create_requisition', 'create_purchase_order'].some(permission => permissions.includes(permission))) throw new ForbiddenException('Catalog access is required');
    }
    if (req.method !== 'GET') {
      const permissions = await this.iam.permissionsForCompanyUser(membership.id);
      if (!permissions.includes('manage_catalog')) throw new ForbiddenException('Catalog management permission is required');
    }
    req.companyMembership = membership;
    return true;
  }
}
