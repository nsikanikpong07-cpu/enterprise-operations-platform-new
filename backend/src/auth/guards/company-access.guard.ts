import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { isUUID } from 'class-validator';

import type { CompanyUser } from '../../iam/entities/company-user.entity.js';
import { IamService } from '../../iam/providers/iam.service.js';
import type { AuthenticatedRequest } from './jwt-auth.guard.js';

// Adds the verified company membership to the authenticated request.
export interface CompanyAuthenticatedRequest
  extends AuthenticatedRequest {
  companyMembership?: CompanyUser;
}

@Injectable()
export class CompanyAccessGuard implements CanActivate {
  constructor(private readonly iam: IamService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<CompanyAuthenticatedRequest>();

    // JwtAuthGuard must run before this guard.
    if (!request.user) {
      throw new UnauthorizedException(
        'Authentication is required',
      );
    }

    // This guard currently reads companyId from the URL query.
    const companyId = request.query.companyId;

    if (
      typeof companyId !== 'string' ||
      !isUUID(companyId)
    ) {
      throw new BadRequestException(
        'companyId must be a valid UUID',
      );
    }

    // Resolve membership using the logged-in user's ID.
    // Never trust a membership ID supplied by the caller.
    const membership =
      await this.iam.requireActiveCompanyMembership(
        request.user.id,
        companyId,
      );

    // The permission guard will use this verified membership.
    request.companyMembership = membership;

    return true;
  }
}