import type { MigrationInterface, QueryRunner } from "typeorm";

/** Align goods_receipts with the shared timestamp fields used by TypeORM. */
export class AddGoodsReceiptUpdatedAt1791760900000 implements MigrationInterface {
  name = "AddGoodsReceiptUpdatedAt1791760900000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE procurement.goods_receipts ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE procurement.goods_receipt_items ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE procurement.goods_receipt_items ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()`);
  }
  async down(): Promise<void> {
    throw new Error("Review existing receipt timestamps before rollback");
  }
}
