import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import { isUUID } from "class-validator";
import { Repository } from "typeorm";
import { CompanyUser } from "../../iam/entities/company-user.entity.js";
import { IamService } from "../../iam/providers/iam.service.js";
import {
  IAM_SCOPE_KEY,
  type IamScopeOptions,
} from "../decorators/iam-scope.decorator.js";
import type { CompanyAuthenticatedRequest } from "./company-access.guard.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";

@Injectable()
export class IamAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtGuard: JwtAuthGuard,
    private readonly iam: IamService,
    @InjectRepository(CompanyUser)
    private readonly memberships: Repository<CompanyUser>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<CompanyAuthenticatedRequest>();
    // This global provider protects IAM only. Other modules need their own
    // authorization policies; they are not claimed to be protected here.
    let path: string;
    try {
      path = decodeURIComponent(request.path).toLowerCase();
    } catch {
      throw new BadRequestException("Invalid request path");
    }
    const iamPath = path === "/iam" || path.startsWith("/iam/");
    const auditPath = path === "/audit/logs" || path.startsWith("/audit/logs/");
    if (!iamPath && !auditPath) return true;

    await this.jwtGuard.canActivate(context);
    const scope = this.reflector.getAllAndOverride<IamScopeOptions>(
      IAM_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );
    // A new IAM endpoint cannot accidentally become public by omitting metadata.
    if (!scope)
      throw new ForbiddenException("IAM access policy is not configured");

    const container = request[scope.location] as
      Record<string, unknown> | undefined;
    const resourceId = container?.[scope.key];
    if (typeof resourceId !== "string" || !isUUID(resourceId)) {
      throw new BadRequestException(`${scope.key} must be a valid UUID`);
    }

    let companyId: string;
    if (scope.kind === "company") {
      companyId = resourceId;
    } else if (scope.kind === "role") {
      companyId = (await this.iam.findRole(resourceId)).company.id;
    } else if (scope.kind === "membership") {
      companyId = (await this.iam.findCompanyUser(resourceId)).company.id;
    } else {
      const target = await this.memberships.findOne({
        where: { user: { id: resourceId } },
        relations: { company: true },
      });
      if (!target) throw new NotFoundException("Staff membership not found");
      companyId = target.company.id;
    }

    // Optional query context must agree with the actual resource owner.
    if (
      request.query.companyId !== undefined &&
      request.query.companyId !== companyId
    ) {
      throw new ForbiddenException(
        "The resource does not belong to the requested company",
      );
    }
    const membership = await this.iam.requireActiveCompanyMembership(
      request.user.id,
      companyId,
    );
    const permissions = await this.iam.permissionsForCompanyUser(membership.id);
    if (!permissions.includes("manage_iam")) {
      throw new ForbiddenException(
        "Company administrator permission is required",
      );
    }
    request.companyMembership = membership;
    return true;
  }
}
