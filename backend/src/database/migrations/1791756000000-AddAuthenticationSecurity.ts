import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthenticationSecurity1791756000000 implements MigrationInterface {
  name = "AddAuthenticationSecurity1791756000000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE iam.users ADD COLUMN auth_version integer NOT NULL DEFAULT 0 CHECK (auth_version >= 0)",
    );
    await queryRunner.query(`
      CREATE TABLE iam.auth_rate_limits (
        key varchar(64) PRIMARY KEY,window_start timestamptz NOT NULL,attempts integer NOT NULL CHECK(attempts >= 0)
      )
    `);
    await queryRunner.query(
      "CREATE INDEX idx_auth_rate_window ON iam.auth_rate_limits(window_start)",
    );
    await queryRunner.query(`
      CREATE TABLE iam.password_reset_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
        token_hash varchar(64) NOT NULL UNIQUE,auth_version integer NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL,used_at timestamptz
      )
    `);
    await queryRunner.query(
      "CREATE INDEX idx_password_reset_user ON iam.password_reset_tokens(user_id)",
    );
    await queryRunner.query(`
      CREATE TABLE iam.auth_mail_outbox (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),payload text,
        user_id uuid NOT NULL REFERENCES iam.users(id) ON DELETE CASCADE,
        status varchar(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','sent','cancelled')),
        attempts integer NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL,next_attempt_at timestamptz NOT NULL DEFAULT now(),locked_at timestamptz
      )
    `);
    await queryRunner.query(
      "CREATE INDEX idx_auth_mail_pending ON iam.auth_mail_outbox(status,next_attempt_at)",
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    // Removing revocation state would allow older tokens to regain validity
    // with older code. Reverting this security migration is a deliberate maintenance action.
    throw new Error(
      "Automatic revert is disabled for authentication security. Restore a coordinated code/database backup and rotate JWT_SECRET if rollback is required.",
    );
  }
}
