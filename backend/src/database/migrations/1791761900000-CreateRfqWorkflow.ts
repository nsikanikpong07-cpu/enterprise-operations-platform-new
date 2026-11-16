import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRfqWorkflow1791761900000 implements MigrationInterface {
  name = 'CreateRfqWorkflow1791761900000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`INSERT INTO iam.permissions(name,description) VALUES ('create_rfq','Create and manage requests for quotation') ON CONFLICT (name) DO NOTHING`);
    await q.query(`INSERT INTO iam.role_permissions(role_id,permission_id)
      SELECT DISTINCT rp.role_id,p.id FROM iam.role_permissions rp
      JOIN iam.permissions procurement ON procurement.id=rp.permission_id AND procurement.name IN ('create_purchase_order','create_requisition')
      CROSS JOIN iam.permissions p WHERE p.name='create_rfq'
      ON CONFLICT(role_id,permission_id) DO NOTHING`);
    await q.query(`CREATE SEQUENCE IF NOT EXISTS procurement.rfq_reference_seq START 1001`);
    await q.query(`CREATE TABLE procurement.rfqs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      reference varchar(30) NOT NULL UNIQUE DEFAULT ('RFQ-' || nextval('procurement.rfq_reference_seq')::text),
      company_id uuid NOT NULL REFERENCES organization.companies(id) ON DELETE RESTRICT,
      created_by_membership_id uuid NOT NULL REFERENCES iam.company_users(id) ON DELETE RESTRICT,
      title varchar(200) NOT NULL,
      response_deadline timestamptz NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
      closed_at timestamptz,
      closed_by_membership_id uuid REFERENCES iam.company_users(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CHECK (closed_at IS NOT NULL OR status='open')
    )`);
    await q.query('CREATE INDEX procurement_rfqs_company_status_created_idx ON procurement.rfqs(company_id,status,created_at DESC)');
    await q.query(`CREATE TABLE procurement.rfq_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      rfq_id uuid NOT NULL REFERENCES procurement.rfqs(id) ON DELETE CASCADE,
      name varchar(255) NOT NULL,
      item_type varchar(20) NOT NULL CHECK (item_type IN (\'product\',\'service\')),
      quantity numeric(14,3) NOT NULL CHECK (quantity > 0),
      unit varchar(80) NOT NULL,
      scope text NOT NULL,
      location varchar(255) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await q.query('CREATE INDEX procurement_rfq_items_rfq_idx ON procurement.rfq_items(rfq_id,created_at)');
    await q.query(`CREATE TABLE procurement.rfq_invites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      rfq_id uuid NOT NULL REFERENCES procurement.rfqs(id) ON DELETE CASCADE,
      supplier_id uuid NOT NULL REFERENCES vendor.suppliers(id) ON DELETE RESTRICT,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(rfq_id,supplier_id)
    )`);
    await q.query('CREATE INDEX procurement_rfq_invites_supplier_idx ON procurement.rfq_invites(supplier_id,created_at DESC)');
    await q.query(`CREATE TABLE procurement.rfq_quotes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      rfq_id uuid NOT NULL REFERENCES procurement.rfqs(id) ON DELETE CASCADE,
      supplier_id uuid NOT NULL REFERENCES vendor.suppliers(id) ON DELETE RESTRICT,
      status varchar(20) NOT NULL CHECK (status IN ('submitted','declined')),
      currency char(3),
      total numeric(14,2) CHECK (total IS NULL OR total > 0),
      proposed_date date,
      terms text,
      notes text,
      decline_reason varchar(500),
      submitted_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(rfq_id,supplier_id),
      CHECK ((status='submitted' AND currency IS NOT NULL AND total IS NOT NULL AND proposed_date IS NOT NULL AND terms IS NOT NULL AND submitted_at IS NOT NULL)
          OR (status='declined' AND decline_reason IS NOT NULL))
    )`);
    await q.query('CREATE INDEX procurement_rfq_quotes_rfq_idx ON procurement.rfq_quotes(rfq_id,status,submitted_at)');
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE procurement.rfq_quotes');
    await q.query('DROP TABLE procurement.rfq_invites');
    await q.query('DROP TABLE procurement.rfq_items');
    await q.query('DROP TABLE procurement.rfqs');
    await q.query('DROP SEQUENCE procurement.rfq_reference_seq');
    await q.query(`DELETE FROM iam.role_permissions WHERE permission_id=(SELECT id FROM iam.permissions WHERE name='create_rfq')`);
    await q.query(`DELETE FROM iam.permissions WHERE name='create_rfq'`);
  }
}
