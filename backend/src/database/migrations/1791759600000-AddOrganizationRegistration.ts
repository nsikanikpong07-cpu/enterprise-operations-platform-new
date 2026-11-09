import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrganizationRegistration1791759600000 implements MigrationInterface {
  name = "AddOrganizationRegistration1791759600000";
  async up(queryRunner: QueryRunner): Promise<void> {
    // Seed a supported platform permission and preserve existing administrators' Organization access.
    await queryRunner.query(
      `INSERT INTO iam.permissions (name, description) VALUES ('manage_organization','Manage company details, departments and locations') ON CONFLICT (name) DO NOTHING`,
    );
    await queryRunner.query(`INSERT INTO iam.role_permissions (role_id, permission_id)
      SELECT DISTINCT rp.role_id, org.id FROM iam.role_permissions rp
      JOIN iam.permissions iam ON iam.id=rp.permission_id AND iam.name='manage_iam'
      CROSS JOIN iam.permissions org WHERE org.name='manage_organization'
      ON CONFLICT (role_id,permission_id) DO NOTHING`);
    await queryRunner.query(`
      CREATE TABLE vendor.supplier_accounts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL UNIQUE REFERENCES iam.users(id),
        supplier_id uuid NOT NULL UNIQUE REFERENCES vendor.suppliers(id),
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE organization.registrations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_user_id uuid NOT NULL UNIQUE REFERENCES iam.users(id),
        account_type varchar(20) NOT NULL CHECK(account_type IN ('company','vendor','both')),
        company_id uuid UNIQUE REFERENCES organization.companies(id),
        supplier_id uuid UNIQUE REFERENCES vendor.suppliers(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        CHECK ((account_type='company' AND company_id IS NOT NULL AND supplier_id IS NULL) OR
               (account_type='vendor' AND company_id IS NULL AND supplier_id IS NOT NULL) OR
               (account_type='both' AND company_id IS NOT NULL AND supplier_id IS NOT NULL))
      )
    `);
  }
  async down(_queryRunner: QueryRunner): Promise<void> {
    throw new Error(
      "Registration history is retained. Use a reviewed maintenance migration for rollback.",
    );
  }
}
