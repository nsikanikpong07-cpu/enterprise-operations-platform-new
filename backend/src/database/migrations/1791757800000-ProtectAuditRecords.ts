import type { MigrationInterface, QueryRunner } from "typeorm";

export class ProtectAuditRecords1791757800000 implements MigrationInterface {
  name = "ProtectAuditRecords1791757800000";
  async up(queryRunner: QueryRunner): Promise<void> {
    // Preserve existing records. Existing snake_case columns match the original SQL schema.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION audit.reject_audit_mutation()
      RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        RAISE EXCEPTION 'Audit records are append-only' USING ERRCODE='55000';
      END;
      $$
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_audit_no_update_delete
      BEFORE UPDATE OR DELETE ON audit.audit_logs
      FOR EACH ROW EXECUTE FUNCTION audit.reject_audit_mutation()
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_audit_no_truncate
      BEFORE TRUNCATE ON audit.audit_logs
      FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_audit_mutation()
    `);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    throw new Error(
      "Automatic removal of audit protections is disabled. Use a reviewed maintenance migration if an operational change is required.",
    );
  }
}
