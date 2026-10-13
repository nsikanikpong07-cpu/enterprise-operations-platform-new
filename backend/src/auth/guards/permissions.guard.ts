import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IamService } from '../../iam/providers/iam.service.js';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator.js';
import type { CompanyAuthenticatedRequest } from './company-access.guard.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly iam: IamService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<CompanyAuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException(
        'Authentication is required',
      );
    }

    // Read permissions declared on the method or controller.
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(
        REQUIRED_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    // CompanyAccessGuard must establish membership first.
    const membership = request.companyMembership;

    if (!membership || membership.status !== 'active') {
      throw new ForbiddenException(
        'An active company membership is required',
      );
    }

    // Load current permissions from the database.
    // Permissions come from roles assigned to this membership.
    const grantedPermissions =
      await this.iam.permissionsForCompanyUser(membership.id);

    // Require every permission listed by the decorator.
    const allowed = requiredPermissions.every((permission) =>
      grantedPermissions.includes(permission),
    );

    if (!allowed) {
      throw new ForbiddenException(
        'You do not have the required permission',
      );
    }

    return true;
  }
}