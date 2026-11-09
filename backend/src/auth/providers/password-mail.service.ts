import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import nodemailer, { type Transporter } from "nodemailer";
import { DataSource } from "typeorm";

@Injectable()
export class PasswordMailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PasswordMailService.name);
  private timer?: ReturnType<typeof setInterval>;
  private busy = false;
  private transport?: Transporter;

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  enabled(): boolean {
    return this.config.get<string>("PASSWORD_RECOVERY_ENABLED") === "true";
  }

  settings() {
    if (!this.enabled())
      throw new ServiceUnavailableException(
        "Password recovery is not configured",
      );
    const key = this.config.get<string>("PASSWORD_RESET_MAIL_KEY") ?? "";
    const host = this.config.get<string>("SMTP_HOST");
    const user = this.config.get<string>("SMTP_USER");
    const password = this.config.get<string>("SMTP_PASSWORD");
    const from = this.config.get<string>("SMTP_FROM");
    const url = this.config.get<string>("PASSWORD_RESET_URL");
    const port = Number(this.config.get<string>("SMTP_PORT") ?? "587");
    if (
      !/^[0-9a-f]{64}$/i.test(key) ||
      !host ||
      !user ||
      !password ||
      !from ||
      !url ||
      ![465, 587].includes(port)
    ) {
      throw new ServiceUnavailableException(
        "Password recovery configuration is incomplete",
      );
    }
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new ServiceUnavailableException(
        "Invalid password reset URL configuration",
      );
    }
    const localDevelopment =
      this.config.get<string>("NODE_ENV") !== "production" &&
      ["localhost", "127.0.0.1"].includes(parsed.hostname);
    if (
      parsed.protocol !== "https:" &&
      !(localDevelopment && parsed.protocol === "http:")
    ) {
      throw new ServiceUnavailableException(
        "Password reset URL must use HTTPS",
      );
    }
    if (parsed.username || parsed.password || /[\r\n]/.test(from)) {
      throw new ServiceUnavailableException(
        "Invalid password recovery configuration",
      );
    }
    return {
      key: Buffer.from(key, "hex"),
      host,
      user,
      password,
      from,
      url,
      port,
    };
  }

  encrypt(email: string, token: string): string {
    const { key } = this.settings();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const data = Buffer.concat([
      cipher.update(JSON.stringify({ email, token }), "utf8"),
      cipher.final(),
    ]);
    return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64");
  }

  private decrypt(payload: string): { email: string; token: string } {
    const { key } = this.settings();
    const bytes = Buffer.from(payload, "base64");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      bytes.subarray(0, 12),
    );
    decipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([
        decipher.update(bytes.subarray(28)),
        decipher.final(),
      ]).toString("utf8"),
    );
  }

  onModuleInit() {
    if (!this.enabled()) return;
    const settings = this.settings();
    // TLS is mandatory: implicit TLS on 465 or STARTTLS on 587.
    this.transport = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.port === 465,
      requireTLS: true,
      auth: { user: settings.user, pass: settings.password },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
      logger: false,
      debug: false,
    });
    this.timer = setInterval(() => {
      void this.flush();
    }, 15000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    this.transport?.close();
  }

  private async flush(): Promise<void> {
    if (this.busy || !this.transport) return;
    this.busy = true;
    try {
      // Claim short-lived mail jobs atomically. A lease permits recovery
      // after a process crash; delivery is at-least-once, not exactly-once.
      const jobs = await this.dataSource.transaction(async (manager) => {
        const rows = await manager.query(`
          SELECT id,payload FROM iam.auth_mail_outbox
          WHERE expires_at > now() AND attempts < 5 AND
            ((status='pending' AND next_attempt_at <= now()) OR
             (status='processing' AND locked_at < now()-interval '5 minutes'))
          ORDER BY created_at LIMIT 5 FOR UPDATE SKIP LOCKED
        `);
        for (const row of rows)
          await manager.query(
            `
          UPDATE iam.auth_mail_outbox SET status='processing',locked_at=now(),attempts=attempts+1 WHERE id=$1
        `,
            [row.id],
          );
        return rows;
      });
      for (const job of jobs) {
        try {
          const { email, token } = this.decrypt(job.payload);
          const settings = this.settings();
          const link = new URL(settings.url);
          link.searchParams.set("token", token);
          await this.transport.sendMail({
            from: settings.from,
            to: email,
            subject: "Reset your Enterprise Operations password",
            text: `A password reset was requested for your account. Use this link within 15 minutes:\n\n${link.toString()}\n\nIf you did not request this, ignore this email.`,
          });
          await this.dataSource.query(
            "UPDATE iam.auth_mail_outbox SET status='sent',payload=NULL,locked_at=NULL WHERE id=$1 AND status='processing'",
            [job.id],
          );
        } catch {
          // Do not log email content, credentials, or reset tokens.
          this.logger.warn(
            "Password reset mail delivery failed; a bounded retry is scheduled",
          );
          await this.dataSource.query(
            `
            UPDATE iam.auth_mail_outbox SET status='pending',locked_at=NULL,next_attempt_at=now()+interval '1 minute' WHERE id=$1 AND status='processing'
          `,
            [job.id],
          );
        }
      }
      // Purge sensitive encrypted payloads after expiry and exhausted retries.
      await this.dataSource.query(`
        UPDATE iam.auth_mail_outbox SET status='cancelled',payload=NULL
        WHERE status IN ('pending','processing') AND (expires_at <= now() OR attempts >= 5)
      `);
      await this.dataSource.query(
        "DELETE FROM iam.auth_rate_limits WHERE window_start < now()-interval '1 day'",
      );
      await this.dataSource.query(
        "DELETE FROM iam.password_reset_tokens WHERE expires_at < now()-interval '1 day'",
      );
      await this.dataSource.query(
        "DELETE FROM iam.auth_mail_outbox WHERE created_at < now()-interval '7 days'",
      );
    } catch {
      this.logger.error(
        "Password recovery mail worker encountered an operational error",
      );
    } finally {
      this.busy = false;
    }
  }
}
