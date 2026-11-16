import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SecureSupplierVerification1791761000000 implements MigrationInterface {
  name = 'SecureSupplierVerification1791761000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS vendor.platform_reviewers (user_id uuid PRIMARY KEY REFERENCES iam.users(id) ON DELETE CASCADE, is_active boolean NOT NULL DEFAULT true, granted_at timestamptz NOT NULL DEFAULT now())`);
    await queryRunner.query(`ALTER TABLE vendor.verification_cases ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES iam.users(id)`);
    // Existing approvals predate access controls. They must be reviewed again.
  }
  async down(): Promise<void> {
    throw new Error('Review supplier verification history before rollback');
  }
}
