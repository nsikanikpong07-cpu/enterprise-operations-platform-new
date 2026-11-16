import type { MigrationInterface, QueryRunner } from 'typeorm';

export class GlobalSupplierVerification1791761800000 implements MigrationInterface {
  name = 'GlobalSupplierVerification1791761800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE vendor.verification_cases
        ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES vendor.suppliers(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS assigned_reviewer_id uuid REFERENCES iam.users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS decision_source varchar(30) NOT NULL DEFAULT 'manual'
    `);
    await queryRunner.query(`
      UPDATE vendor.verification_cases c
      SET supplier_id = p.supplier_id
      FROM vendor.supplier_company_profiles p
      WHERE c.supplier_company_profile_id = p.id AND c.supplier_id IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE vendor.verification_cases
        ALTER COLUMN supplier_company_profile_id DROP NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS verification_cases_supplier_opened_idx
      ON vendor.verification_cases (supplier_id, opened_at DESC, id DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS verification_cases_queue_idx
      ON vendor.verification_cases (status, opened_at ASC, id ASC)
    `);
  }

  async down(): Promise<void> {
    throw new Error('Review global verification cases and reviewer assignments before rollback');
  }
}
