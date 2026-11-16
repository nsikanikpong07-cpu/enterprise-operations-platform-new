import { ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SuppliersController } from '../../vendor/controllers/suppliers.controller.js';
import { VerificationController } from '../../vendor/controllers/verification.controller.js';
import { JwtAuthGuard, type AuthenticatedRequest } from './jwt-auth.guard.js';

/** Until company/vendor access policies exist, vendor APIs are restricted to platform reviewers. */
@Injectable()
export class VendorPlatformGuard implements CanActivate {
  constructor(private readonly jwt: JwtAuthGuard, private readonly db: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const controller = context.getClass();
    if (controller !== SuppliersController && controller !== VerificationController) return true;
    await this.jwt.canActivate(context);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const reviewers = await this.db.query('SELECT 1 FROM vendor.platform_reviewers WHERE user_id = $1 AND is_active = true', [request.user.id]);
    if (!reviewers.length) throw new ForbiddenException('Platform reviewer access is required');
    // Never trust a caller-supplied reviewer identity.
    if (controller === VerificationController && request.body && typeof request.body === 'object') {
      if (context.getHandler().name === 'openCase') request.body.openedById = request.user.id;
      if (context.getHandler().name === 'assess') request.body.assessedById = request.user.id;
    }
    return true;
  }
}
