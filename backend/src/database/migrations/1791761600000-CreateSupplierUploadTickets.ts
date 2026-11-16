import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSupplierUploadTickets1791761600000 implements MigrationInterface {
  name = 'CreateSupplierUploadTickets1791761600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS vendor.supplier_upload_tickets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        token_hash varchar(64) NOT NULL UNIQUE,
        supplier_id uuid NOT NULL REFERENCES vendor.suppliers(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
        expires_at timestamptz NOT NULL,
        consumed_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_supplier_upload_tickets_expiry ON vendor.supplier_upload_tickets (expires_at)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS vendor.supplier_upload_tickets');
  }
}
