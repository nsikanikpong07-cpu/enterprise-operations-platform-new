import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRequisitionCurrency1791761200000 implements MigrationInterface {
  name = 'AddRequisitionCurrency1791761200000';
  async up(queryRunner: QueryRunner): Promise<void> {
    // Existing estimates have no recorded currency; keep those as unknown.
    await queryRunner.query(`ALTER TABLE procurement.requisitions ADD COLUMN IF NOT EXISTS currency varchar(3)`);
    await queryRunner.query(`ALTER TABLE procurement.requisitions ALTER COLUMN currency SET DEFAULT 'NGN'`);
  }
  async down(): Promise<void> { throw new Error('Requisition currencies require review before rollback'); }
}
