import type {
  MigrationInterface,
  QueryRunner,
} from 'typeorm';

export class AddRoleCompanyOwnership1791747000000
  implements MigrationInterface
{
  name = 'AddRoleCompanyOwnership1791747000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const companyId = 'f952d153-49ee-46a0-998b-f912367679db';

    // These are the two existing roles you confirmed belong
    // to Enterprise Operations.
    const roleIds = [
      'a09676c9-0405-461a-957b-2f416a81e12b',
      'cdb1d11b-ee4a-4d86-9c01-6524f36f58a1',
    ];

    const companies = await queryRunner.query(
      `SELECT id FROM organization.companies WHERE id = $1`,
      [companyId],
    );

    if (companies.length !== 1) {
      throw new Error(
        'Enterprise Operations was not found. No role ownership was changed.',
      );
    }

    // Start nullable so existing records can be assigned safely.
    await queryRunner.query(`
      ALTER TABLE iam.roles
      ADD COLUMN company_id uuid
    `);

    await queryRunner.query(
      `
        UPDATE iam.roles
        SET company_id = $1
        WHERE id = ANY($2::uuid[])
      `,
      [companyId, roleIds],
    );

    // Do not guess ownership if additional roles exist.
    const unassignedRoles = await queryRunner.query(`
      SELECT id, name
      FROM iam.roles
      WHERE company_id IS NULL
    `);

    if (unassignedRoles.length > 0) {
      throw new Error(
        'Additional roles have no confirmed company owner. ' +
          'The migration has stopped without completing.',
      );
    }

    // Existing assignments must belong to the role's company.
    const conflictingAssignments = await queryRunner.query(`
      SELECT ur.id
      FROM iam.user_roles ur
      JOIN iam.roles r ON r.id = ur.role_id
      JOIN iam.company_users cu ON cu.id = ur.company_user_id
      WHERE cu.company_id <> r.company_id
    `);

    if (conflictingAssignments.length > 0) {
      throw new Error(
        'A role is assigned to a member of another company. ' +
          'Resolve that assignment before running this migration.',
      );
    }

    await queryRunner.query(`
      ALTER TABLE iam.roles
      ALTER COLUMN company_id SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE iam.roles
      ADD CONSTRAINT fk_roles_company
      FOREIGN KEY (company_id)
      REFERENCES organization.companies(id)
      ON DELETE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX idx_roles_company_id
      ON iam.roles(company_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove ownership without deleting roles or assignments.
    await queryRunner.query(`
      DROP INDEX IF EXISTS iam.idx_roles_company_id
    `);

    await queryRunner.query(`
      ALTER TABLE iam.roles
      DROP CONSTRAINT fk_roles_company
    `);

    await queryRunner.query(`
      ALTER TABLE iam.roles
      DROP COLUMN company_id
    `);
  }
}