import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIssuedPurchaseOrderStatus1791761400000 implements MigrationInterface {
  name = 'AddIssuedPurchaseOrderStatus1791761400000';
  async up(q: QueryRunner): Promise<void> {
    // The supplied schema uses this named check. Do not alter existing orders.
    const checks = await q.query(`SELECT c.conname FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='procurement' AND t.relname='purchase_orders' AND c.contype='c' AND pg_get_constraintdef(c.oid) ~* '\\mstatus\\M' AND c.conname <> 'chk_purchase_orders_status'`);
    if (checks.length) throw new Error('Unexpected purchase order status check: review the database constraint before enabling Issued');
    await q.query(`ALTER TABLE procurement.purchase_orders DROP CONSTRAINT IF EXISTS chk_purchase_orders_status`);
    await q.query(`ALTER TABLE procurement.purchase_orders ADD CONSTRAINT chk_purchase_orders_status CHECK (status IN ('Draft','Submitted','Pending','Approved','Rejected','Cancelled','Completed','Issued'))`);
  }
  async down(): Promise<void> { throw new Error('Review issued orders before rolling back this status change'); }
}
