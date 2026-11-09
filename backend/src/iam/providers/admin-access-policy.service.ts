import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { Company } from "../../organization/entities/company.entity.js";

@Injectable()
export class AdminAccessPolicyService {
  constructor(private readonly dataSource: DataSource) {}

  async change<T>(
    companyId: string,
    operation: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      // Every access-reducing operation locks the SAME company row first.
      // Two admins cannot concurrently remove each other's final access.
      const company = await manager.findOne(Company, {
        where: { id: companyId },
        lock: { mode: "pessimistic_write" },
      });
      if (!company) throw new NotFoundException("Company not found");
      const before = await this.countActiveAdministrators(manager, companyId);
      const result = await operation(manager);
      const after = await this.countActiveAdministrators(manager, companyId);
      if (before > 0 && after === 0) {
        // Throwing rolls back the operation, including deletions and status changes.
        throw new ConflictException(
          "This change would remove the company’s last active administrator. Assign another active administrator first.",
        );
      }
      return result;
    });
  }

  private async countActiveAdministrators(
    manager: EntityManager,
    companyId: string,
  ): Promise<number> {
    // Count people, not roles: one person with multiple admin roles is one admin.
    const rows = await manager.query(
      `
      SELECT COUNT(DISTINCT cu.user_id)::int AS count
      FROM iam.company_users cu
      JOIN iam.users u ON u.id = cu.user_id
      JOIN organization.companies c ON c.id = cu.company_id
      JOIN iam.user_roles ur ON ur.company_user_id = cu.id
      JOIN iam.roles r ON r.id = ur.role_id AND r.company_id = cu.company_id
      JOIN iam.role_permissions rp ON rp.role_id = r.id
      JOIN iam.permissions p ON p.id = rp.permission_id
      WHERE cu.company_id = $1 AND cu.status = 'active'
        AND u.status = 'active' AND c.status = 'active'
        AND p.name = 'manage_iam'
    `,
      [companyId],
    );
    return Number(rows[0].count);
  }
}
