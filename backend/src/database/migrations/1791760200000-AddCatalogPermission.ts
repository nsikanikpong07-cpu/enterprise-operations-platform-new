import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddCatalogPermission1791760200000 implements MigrationInterface {
  name = "AddCatalogPermission1791760200000";
  async up(q: QueryRunner): Promise<void> {
    await q.query(`INSERT INTO iam.permissions (name, description) VALUES ('manage_catalog','Manage company catalog items and categories') ON CONFLICT (name) DO NOTHING`);
    await q.query(`INSERT INTO iam.role_permissions (role_id, permission_id) SELECT DISTINCT rp.role_id, p.id FROM iam.role_permissions rp JOIN iam.permissions admin ON admin.id = rp.permission_id AND admin.name = 'manage_iam' CROSS JOIN iam.permissions p WHERE p.name = 'manage_catalog' ON CONFLICT (role_id,permission_id) DO NOTHING`);
  }
  async down(): Promise<void> { throw new Error("Catalog permissions require a reviewed rollback"); }
}
