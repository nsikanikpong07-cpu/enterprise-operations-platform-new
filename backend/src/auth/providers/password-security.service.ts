import { AuditWriterService } from "../../audit/providers/audit-writer.service.js";
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { setTimeout as pause } from "node:timers/promises";
import { DataSource, type EntityManager } from "typeorm";
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from "../../iam/providers/password-hasher.provider.js";
import { AuthRateLimitService } from "./auth-rate-limit.service.js";
import { PasswordMailService } from "./password-mail.service.js";

@Injectable()
export class PasswordSecurityService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly rateLimit: AuthRateLimitService,
    private readonly mail: PasswordMailService,
    private readonly audit: AuditWriterService,
  ) {}

  async forgot(emailInput: string, ip: string) {
    const started = Date.now();
    const email = emailInput.trim().toLowerCase();
    // Disabled configuration produces the same error for every email.
    this.mail.settings();
    await this.rateLimit.consume("forgot", ip, email);
    const rows = await this.dataSource.query(
      "SELECT id,status,auth_version FROM iam.users WHERE LOWER(BTRIM(email))=$1",
      [email],
    );
    const user = rows[0];
    if (user?.status === "active") {
      const token = randomBytes(32).toString("base64url");
      const hash = createHash("sha256").update(token).digest("hex");
      const encrypted = this.mail.encrypt(email, token);
      await this.dataSource.transaction(async (manager) => {
        // Do not invalidate previous unused requests here: an attacker must
        // not be able to cancel a link already received by the account owner.
        await manager.query(
          `
          INSERT INTO iam.password_reset_tokens (user_id,token_hash,auth_version,expires_at)
          VALUES ($1,$2,$3,now()+interval '15 minutes')
        `,
          [user.id, hash, user.auth_version],
        );
        await manager.query(
          `
          INSERT INTO iam.auth_mail_outbox (payload,user_id,expires_at)
          VALUES ($1,$2,now()+interval '15 minutes')
        `,
          [encrypted, user.id],
        );
        await this.audit.write(manager, {
          action: "password_recovery_requested",
          entityType: "user",
          entityId: user.id,
          actorId: null,
        });
      });
    }
    // Equal response shape and a minimum duration reduce enumeration signals.
    // Operational DB latency still requires monitoring in production.
    await pause(Math.max(0, 400 - (Date.now() - started)));
    return {
      message:
        "If the account is eligible, password reset instructions will be sent.",
    };
  }

  async reset(token: string, newPassword: string, ip: string) {
    await this.rateLimit.consume("reset", ip);
    const hash = createHash("sha256").update(token).digest("hex");
    const candidates = await this.dataSource.query(
      "SELECT user_id FROM iam.password_reset_tokens WHERE token_hash=$1",
      [hash],
    );
    if (!candidates[0])
      throw new BadRequestException("Invalid or expired password reset token");
    await this.dataSource.transaction(async (manager) => {
      // All password mutations lock USER first, then reset tokens. This
      // consistent lock order avoids reset/change-password deadlocks.
      const users = await manager.query(
        "SELECT id,status,auth_version FROM iam.users WHERE id=$1 FOR UPDATE",
        [candidates[0].user_id],
      );
      const user = users[0];
      const tokens = await manager.query(
        `
        SELECT id,auth_version FROM iam.password_reset_tokens
        WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() FOR UPDATE
      `,
        [hash],
      );
      if (
        !user ||
        user.status !== "active" ||
        !tokens[0] ||
        tokens[0].auth_version !== user.auth_version
      ) {
        throw new BadRequestException(
          "Invalid or expired password reset token",
        );
      }
      const encoded = await this.hasher.hash(newPassword);
      await this.savePassword(manager, user.id, encoded);
      await this.audit.write(manager, {
        action: "password_reset",
        entityType: "user",
        entityId: user.id,
        actorId: user.id,
        newValues: { sessionsRevoked: true },
      });
    });
    return {
      message: "Password reset completed. Log in with your new password.",
    };
  }

  async change(
    userId: string,
    tokenVersion: number,
    currentPassword: string,
    newPassword: string,
    ip: string,
  ) {
    await this.rateLimit.consume("change", ip, userId);
    await this.dataSource.transaction(async (manager) => {
      const rows = await manager.query(
        "SELECT id,status,password_hash,auth_version FROM iam.users WHERE id=$1 FOR UPDATE",
        [userId],
      );
      const user = rows[0];
      if (
        !user ||
        user.status !== "active" ||
        user.auth_version !== tokenVersion
      ) {
        throw new UnauthorizedException("The login session is no longer valid");
      }
      let matches = false;
      try {
        matches = await this.hasher.verify(currentPassword, user.password_hash);
      } catch {
        matches = false;
      }
      if (!matches)
        throw new BadRequestException("Current password is incorrect");
      if (currentPassword === newPassword)
        throw new BadRequestException("Choose a different password");
      await this.savePassword(
        manager,
        userId,
        await this.hasher.hash(newPassword),
      );
      await this.audit.write(manager, {
        action: "password_changed",
        entityType: "user",
        entityId: userId,
        actorId: userId,
        newValues: { sessionsRevoked: true },
      });
    });
    return {
      message:
        "Password changed. All existing login tokens were revoked. Log in again.",
    };
  }

  async logout(userId: string, tokenVersion: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const rows = await manager.query(
        `
      UPDATE iam.users SET auth_version=auth_version+1,updated_at=now()
      WHERE id=$1 AND auth_version=$2 RETURNING id
    `,
        [userId, tokenVersion],
      );
      if (!rows.length)
        throw new UnauthorizedException("The login session is no longer valid");
      await this.audit.write(manager, {
        action: "logout_all_sessions",
        entityType: "user",
        entityId: userId,
        actorId: userId,
        newValues: { sessionsRevoked: true },
      });
    });
  }

  private async savePassword(
    manager: EntityManager,
    userId: string,
    encoded: string,
  ) {
    await manager.query(
      "UPDATE iam.users SET password_hash=$2,auth_version=auth_version+1,updated_at=now() WHERE id=$1",
      [userId, encoded],
    );
    await manager.query(
      "UPDATE iam.password_reset_tokens SET used_at=now() WHERE user_id=$1 AND used_at IS NULL",
      [userId],
    );
    await manager.query(
      "UPDATE iam.auth_mail_outbox SET status='cancelled',payload=NULL WHERE user_id=$1 AND status IN ('pending','processing')",
      [userId],
    );
    // Cancel pending mail payloads immediately after a password update.
    // Previously delivered links are also invalid after this version change.
  }
}
