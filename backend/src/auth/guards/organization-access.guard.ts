import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { isUUID } from "class-validator";
import { OrganizationController } from "../../organization/controllers/organization.controller.js";
import { IamService } from "../../iam/providers/iam.service.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import type { CompanyAuthenticatedRequest } from "./company-access.guard.js";

@Injectable()
export class OrganizationAccessGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtAuthGuard,
    private readonly iam: IamService,
    private readonly db: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Match the actual controller, including case-insensitive routes and global prefixes.
    // Registration has its own controller and remains public and rate limited.
    if (context.getClass() !== OrganizationController) return true;
    await this.jwt.canActivate(context);
    const req = context
      .switchToHttp()
      .getRequest<CompanyAuthenticatedRequest>();
    const action = context.getHandler().name;
    const policies: Record<string, [string, string, string]> = {
      findCompany: ["company", "params", "id"],
      updateCompany: ["company", "params", "id"],
      removeCompany: ["company", "params", "id"],
      findDepartments: ["company", "params", "companyId"],
      findLocations: ["company", "params", "companyId"],
      createDepartment: ["company", "body", "companyId"],
      createLocation: ["company", "body", "companyId"],
      updateDepartment: ["department", "params", "id"],
      removeDepartment: ["department", "params", "id"],
      updateLocation: ["location", "params", "id"],
      removeLocation: ["location", "params", "id"],
    };
    let companyId: string;
    if (action === "findCompanies" || action === "createCompany") {
      const rows = await this.db.query(
        "SELECT company_id FROM iam.company_users WHERE user_id=$1",
        [req.user.id],
      );
      if (!rows[0])
        throw new ForbiddenException("Company membership is required");
      companyId = rows[0].company_id;
    } else {
      const policy = policies[action];
      if (!policy)
        throw new ForbiddenException(
          "Organization access policy is not configured",
        );
      const [kind, location, key] = policy;
      const value = (req as unknown as Record<string, Record<string, unknown>>)[
        location
      ]?.[key];
      if (typeof value !== "string" || !isUUID(value))
        throw new BadRequestException(`${key} must be a valid UUID`);
      companyId = value;
      if (kind !== "company") {
        // Table names come only from this fixed policy, never from request input.
        const table = kind === "department" ? "departments" : "locations";
        const rows = await this.db.query(
          `SELECT company_id FROM organization.${table} WHERE id=$1`,
          [value],
        );
        if (!rows[0])
          throw new NotFoundException("Organization resource not found");
        companyId = rows[0].company_id;
      }
    }
    if (req.query.companyId !== undefined && req.query.companyId !== companyId)
      throw new ForbiddenException(
        "The resource does not belong to the requested company",
      );
    const member = await this.iam.requireActiveCompanyMembership(
      req.user.id,
      companyId,
    );
    if (req.method !== "GET") {
      const permissions = await this.iam.permissionsForCompanyUser(member.id);
      if (!permissions.includes("manage_organization"))
        throw new ForbiddenException(
          "Organization management permission is required",
        );
    }
    req.companyMembership = member;
    return true;
  }
}
