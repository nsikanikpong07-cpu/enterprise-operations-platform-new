import type { MigrationInterface, QueryRunner } from 'typeorm';
export class AddRfqReminderTracking1791762100000 implements MigrationInterface {
  name='AddRfqReminderTracking1791762100000';
  async up(q:QueryRunner):Promise<void>{await q.query('ALTER TABLE procurement.rfq_invites ADD COLUMN reminder_sent_at timestamptz');}
  async down(q:QueryRunner):Promise<void>{await q.query('ALTER TABLE procurement.rfq_invites DROP COLUMN reminder_sent_at');}
}
