import type { MigrationInterface, QueryRunner } from "typeorm";
export class AddRequisitionPermission1791760800000 implements MigrationInterface {
  name = "AddRequisitionPermission1791760800000";
  async up(q: QueryRunner): Promise<void> {
    await q.query(`INSERT INTO iam.permissions(name,description) VALUES ('create_requisition','Create purchase requisitions') ON CONFLICT (name) DO NOTHING`);
    await q.query(`INSERT INTO iam.permissions(name,description) VALUES ('approve_requisition','Approve or reject assigned requisitions') ON CONFLICT (name) DO NOTHING`);
    await q.query(`INSERT INTO iam.permissions(name,description) VALUES ('create_purchase_order','Create purchase orders'),('receive_goods','Record received goods') ON CONFLICT (name) DO NOTHING`);
    await q.query(`INSERT INTO iam.role_permissions(role_id,permission_id) SELECT DISTINCT rp.role_id,p.id FROM iam.role_permissions rp JOIN iam.permissions a ON a.id=rp.permission_id AND a.name='manage_iam' CROSS JOIN iam.permissions p WHERE p.name IN ('create_purchase_order','receive_goods') ON CONFLICT (role_id,permission_id) DO NOTHING`);
    await q.query(`INSERT INTO iam.role_permissions(role_id,permission_id) SELECT DISTINCT rp.role_id,p.id FROM iam.role_permissions rp JOIN iam.permissions a ON a.id=rp.permission_id AND a.name='manage_iam' CROSS JOIN iam.permissions p WHERE p.name='approve_requisition' ON CONFLICT (role_id,permission_id) DO NOTHING`);
    await q.query(`INSERT INTO iam.role_permissions(role_id,permission_id) SELECT DISTINCT rp.role_id,p.id FROM iam.role_permissions rp JOIN iam.permissions a ON a.id=rp.permission_id AND a.name='manage_iam' CROSS JOIN iam.permissions p WHERE p.name='create_requisition' ON CONFLICT (role_id,permission_id) DO NOTHING`);
  }
  async down(): Promise<void> { throw new Error("Permission rollback requires review"); }
}
