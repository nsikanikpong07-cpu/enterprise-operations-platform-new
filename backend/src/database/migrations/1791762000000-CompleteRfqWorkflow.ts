import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CompleteRfqWorkflow1791762000000 implements MigrationInterface {
  name = 'CompleteRfqWorkflow1791762000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE procurement.rfqs ADD COLUMN close_reason varchar(30) CHECK (close_reason IN ('selected_quote','buyer_closed','deadline'))`);
    await q.query(`ALTER TABLE procurement.rfqs ADD COLUMN selected_quote_id uuid`);
    await q.query(`CREATE TABLE procurement.rfq_quote_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      quote_id uuid NOT NULL REFERENCES procurement.rfq_quotes(id) ON DELETE CASCADE,
      rfq_item_id uuid NOT NULL REFERENCES procurement.rfq_items(id) ON DELETE RESTRICT,
      unit_price numeric(14,2) NOT NULL CHECK(unit_price > 0),
      line_total numeric(14,2) NOT NULL CHECK(line_total > 0),
      UNIQUE(quote_id,rfq_item_id)
    )`);
    await q.query(`INSERT INTO procurement.rfq_quote_items(quote_id,rfq_item_id,unit_price,line_total)
      SELECT q.id,one_line.id,round(q.total/one_line.quantity,2),q.total
      FROM procurement.rfq_quotes q
      JOIN LATERAL(SELECT id,quantity,count(*) OVER() AS line_count FROM procurement.rfq_items WHERE rfq_id=q.rfq_id ORDER BY created_at,id LIMIT 1) one_line ON one_line.line_count=1
      WHERE q.status='submitted' AND q.total>0 AND NOT EXISTS(SELECT 1 FROM procurement.rfq_quote_items qi WHERE qi.quote_id=q.id)`);
    await q.query(`ALTER TABLE procurement.rfqs ADD CONSTRAINT procurement_rfq_selected_quote_fk FOREIGN KEY (selected_quote_id) REFERENCES procurement.rfq_quotes(id) ON DELETE SET NULL`);
    await q.query(`CREATE TABLE procurement.rfq_purchase_orders (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      po_number varchar(50) NOT NULL UNIQUE,
      rfq_id uuid NOT NULL UNIQUE REFERENCES procurement.rfqs(id) ON DELETE RESTRICT,
      quote_id uuid NOT NULL UNIQUE REFERENCES procurement.rfq_quotes(id) ON DELETE RESTRICT,
      company_id uuid NOT NULL REFERENCES organization.companies(id) ON DELETE RESTRICT,
      supplier_id uuid NOT NULL REFERENCES vendor.suppliers(id) ON DELETE RESTRICT,
      buyer_membership_id uuid NOT NULL REFERENCES iam.company_users(id) ON DELETE RESTRICT,
      currency char(3) NOT NULL,
      total_amount numeric(14,2) NOT NULL CHECK(total_amount > 0),
      proposed_date date NOT NULL,
      terms text NOT NULL,
      items_snapshot jsonb NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','issued','cancelled')),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await q.query(`CREATE TABLE procurement.rfq_notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      rfq_id uuid NOT NULL REFERENCES procurement.rfqs(id) ON DELETE CASCADE,
      supplier_id uuid NOT NULL REFERENCES vendor.suppliers(id) ON DELETE CASCADE,
      notification_type varchar(40) NOT NULL,
      title varchar(180) NOT NULL,
      message text NOT NULL,
      email_to varchar(255),
      email_status varchar(20) NOT NULL DEFAULT 'pending' CHECK(email_status IN ('pending','sent','failed','not_available')),
      read_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await q.query(`CREATE INDEX procurement_rfq_notifications_supplier_idx ON procurement.rfq_notifications(supplier_id,created_at DESC)`);
    await q.query(`CREATE INDEX procurement_rfq_notification_email_idx ON procurement.rfq_notifications(email_status,created_at) WHERE email_status='pending'`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE procurement.rfq_notifications');
    await q.query('DROP TABLE procurement.rfq_purchase_orders');
    await q.query('ALTER TABLE procurement.rfqs DROP CONSTRAINT procurement_rfq_selected_quote_fk');
    await q.query('DROP TABLE procurement.rfq_quote_items');
    await q.query('ALTER TABLE procurement.rfqs DROP COLUMN selected_quote_id');
    await q.query('ALTER TABLE procurement.rfqs DROP COLUMN close_reason');
  }
}
