import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UniqueSupplierPrimaryContact1791761500000 implements MigrationInterface {
  name = 'UniqueSupplierPrimaryContact1791761500000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH ranked_primary_contacts AS (
        SELECT id,
          ROW_NUMBER() OVER (
            PARTITION BY supplier_id
            ORDER BY created_at ASC, id ASC
          ) AS position
        FROM vendor.supplier_contacts
        WHERE is_primary = true
      )
      UPDATE vendor.supplier_contacts AS contacts
      SET is_primary = false
      FROM ranked_primary_contacts AS ranked
      WHERE contacts.id = ranked.id AND ranked.position > 1
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS supplier_contacts_one_primary_idx
      ON vendor.supplier_contacts (supplier_id)
      WHERE is_primary = true
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS vendor.supplier_contacts_one_primary_idx`);
  }
}
