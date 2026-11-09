import type { MigrationInterface, QueryRunner } from "typeorm";

export class PrepareIamAuthorization1791753000000 implements MigrationInterface {
  name = "PrepareIamAuthorization1791753000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Normalized email uniqueness must hold even for concurrent requests.
    const duplicates = await queryRunner.query(`
      SELECT LOWER(BTRIM(email)) AS email FROM iam.users
      GROUP BY LOWER(BTRIM(email)) HAVING COUNT(*) > 1
    `);
    if (duplicates.length) {
      throw new Error(
        "Accounts have duplicate normalized emails. Resolve them without deleting history before retrying.",
      );
    }
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_users_normalized_email
      ON iam.users (LOWER(BTRIM(email)))
    `);
    // Add a platform permission definition, but assign it to nobody.
    await queryRunner.query(`
      INSERT INTO iam.permissions (name, description)
      VALUES ('manage_iam', 'Manage staff, roles, and permission grants within the owning company')
      ON CONFLICT (name) DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DROP INDEX IF EXISTS iam.uq_users_normalized_email",
    );
    // Preserve the permission and existing grants: reverting this index
    // must not unexpectedly revoke an administrator's access.
  }
}
