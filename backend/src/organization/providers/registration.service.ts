import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { User } from "../../iam/entities/user.entity.js";
import { CompanyUser } from "../../iam/entities/company-user.entity.js";
import { Role } from "../../iam/entities/role.entity.js";
import { Permission } from "../../iam/entities/permission.entity.js";
import { RolePermission } from "../../iam/entities/role-permission.entity.js";
import { UserRole } from "../../iam/entities/user-role.entity.js";
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from "../../iam/providers/password-hasher.provider.js";
import { AuditWriterService } from "../../audit/providers/audit-writer.service.js";
import { AuthRateLimitService } from "../../auth/providers/auth-rate-limit.service.js";
import { Supplier } from "../../vendor/entities/supplier.entity.js";
import { Company } from "../entities/company.entity.js";
import { RegisterOrganizationDto } from "../dto/register-organization.dto.js";

@Injectable()
export class RegistrationService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly audit: AuditWriterService,
    private readonly rateLimit: AuthRateLimitService,
  ) {}

  async register(dto: RegisterOrganizationDto, ip: string) {
    if (
      dto.accountType !== "company" &&
      (!dto.legalName || !dto.legalName.trim())
    ) {
      throw new BadRequestException(
        "legalName is required when registering as a vendor or both",
      );
    }
    const email = dto.owner.email.trim().toLowerCase();
    await this.rateLimit.consume("register", ip, email);
    const timezone = dto.timezone ?? "Africa/Lagos";
    try {
      new Intl.DateTimeFormat("en", { timeZone: timezone });
    } catch {
      throw new BadRequestException("timezone must be a valid IANA time zone");
    }
    const passwordHash = await this.hasher.hash(dto.owner.password);
    try {
      return await this.dataSource.transaction(async (manager) => {
        // The login, company/vendor, membership, role, grant, and audit
        // records commit together. Nobody gets a half-created workspace.
        const user = await manager.save(
          User,
          manager.create(User, {
            email,
            passwordHash,
            firstName: dto.owner.firstName,
            lastName: dto.owner.lastName,
            phone: dto.owner.phone,
            status: "active",
          }),
        );
        let company: Company | null = null;
        let membership: CompanyUser | null = null;
        let administratorRole: Role | null = null;
        let vendor: Supplier | null = null;
        if (dto.accountType !== "vendor") {
          const permission = await manager.findOneBy(Permission, {
            name: "manage_iam",
          });
          if (!permission)
            throw new ServiceUnavailableException(
              "Run the IAM permission migrations before registration",
            );
          company = await manager.save(
            Company,
            manager.create(Company, {
              name: dto.name,
              legalName: dto.legalName,
              registrationNumber: dto.registrationNumber,
              taxIdentificationNumber: dto.taxIdentificationNumber,
              industry: dto.industry,
              countryCode: dto.countryCode ?? "NG",
              defaultCurrency: dto.defaultCurrency ?? "NGN",
              timezone,
              status: "active",
            }),
          );
          membership = await manager.save(
            CompanyUser,
            manager.create(CompanyUser, {
              user: { id: user.id },
              company: { id: company.id },
              status: "active",
              jobTitle: "Company Administrator",
            }),
          );
          administratorRole = await manager.save(
            Role,
            manager.create(Role, {
              company: { id: company.id },
              name: "Company Admin",
              description:
                "Initial administrator created during organization registration",
            }),
          );
          const organizationPermission = await manager.findOneBy(Permission, {
            name: "manage_organization",
          });
          if (!organizationPermission)
            throw new ServiceUnavailableException(
              "Run the organization registration migration first",
            );
          for (const grant of [permission, organizationPermission]) {
            await manager.save(
              RolePermission,
              manager.create(RolePermission, {
                role: { id: administratorRole.id },
                permission: { id: grant.id },
              }),
            );
          }
          await manager.save(
            UserRole,
            manager.create(UserRole, {
              companyUser: { id: membership.id },
              role: { id: administratorRole.id },
            }),
          );
          await this.audit.write(manager, {
            action: "company_registered",
            entityType: "company",
            entityId: company.id,
            companyId: company.id,
            actorId: user.id,
            newValues: { name: company.name, status: "active" },
          });
          await this.audit.write(manager, {
            action: "initial_administrator_created",
            entityType: "company_user",
            entityId: membership.id,
            companyId: company.id,
            actorId: user.id,
            newValues: {
              userId: user.id,
              roleId: administratorRole.id,
              permissionId: permission.id,
            },
          });
        }
        if (dto.accountType !== "company") {
          // Creating a vendor identity does NOT approve certificates or
          // make the vendor verified/discoverable. Verification is separate.
          vendor = await manager.save(
            Supplier,
            manager.create(Supplier, {
              legalName: dto.legalName ?? dto.name,
              tradingName: dto.name,
              registrationNumber: dto.registrationNumber,
              taxIdentificationNumber: dto.taxIdentificationNumber,
              countryCode: dto.countryCode ?? "NG",
              status: "active",
            }),
          );
          await manager.query(
            "INSERT INTO vendor.supplier_accounts (user_id,supplier_id) VALUES ($1,$2)",
            [user.id, vendor.id],
          );
          await this.audit.write(manager, {
            action: "vendor_registered",
            entityType: "supplier",
            entityId: vendor.id,
            companyId: company?.id,
            actorId: user.id,
          });
        }
        const registrations = await manager.query(
          `
          INSERT INTO organization.registrations (owner_user_id,account_type,company_id,supplier_id)
          VALUES ($1,$2,$3,$4) RETURNING id
        `,
          [user.id, dto.accountType, company?.id ?? null, vendor?.id ?? null],
        );
        return {
          registrationId: registrations[0].id,
          accountType: dto.accountType,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            status: user.status,
          },
          company,
          membership,
          administratorRole,
          vendor: vendor
            ? { ...vendor, verificationStatus: "not_verified" }
            : null,
          message:
            "Registration completed. Log in with your email and password.",
        };
      });
    } catch (error: unknown) {
      const code =
        (error as { code?: string; driverError?: { code?: string } })
          ?.driverError?.code ?? (error as { code?: string })?.code;
      if (code === "23505")
        throw new ConflictException(
          "Registration could not be completed with these details. The email may already be registered.",
        );
      throw error;
    }
  }
}
