import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  type OnModuleInit,
  type OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac } from "node:crypto";
import { DataSource } from "typeorm";

@Injectable()
export class AuthRateLimitService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private readonly logger = new Logger(AuthRateLimitService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.dataSource
        .query(
          "DELETE FROM iam.auth_rate_limits WHERE window_start < now()-interval '1 day'",
        )
        .catch(() =>
          this.logger.error("Authentication rate-limit cleanup failed"),
        );
    }, 60000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private key(value: string): string {
    // Store neither raw email addresses nor IP addresses in limiter keys.
    return createHmac("sha256", this.config.getOrThrow<string>("JWT_SECRET"))
      .update(value)
      .digest("hex");
  }

  async consume(
    action: "login" | "forgot" | "reset" | "change" | "register",
    ip: string,
    identity = "",
  ): Promise<void> {
    const limits =
      action === "register"
        ? [10, 3]
        : action === "login"
          ? [30, 8]
          : action === "forgot"
            ? [15, 3]
            : [20, 8];
    const keys = [this.key(`${action}:ip:${ip}`)];
    if (identity)
      keys.push(this.key(`${action}:account:${identity.trim().toLowerCase()}`));
    // Persist limits in PostgreSQL so restarts and multiple API instances
    // cannot reset the counters. Database time defines 15-minute windows.
    for (let i = 0; i < keys.length; i++) {
      const rows = await this.dataSource.query(
        `
        INSERT INTO iam.auth_rate_limits (key, window_start, attempts)
        VALUES ($1, to_timestamp(floor(extract(epoch FROM now()) / 900) * 900), 1)
        ON CONFLICT (key) DO UPDATE SET
          attempts = CASE WHEN iam.auth_rate_limits.window_start = EXCLUDED.window_start
            THEN LEAST(iam.auth_rate_limits.attempts + 1, 1000000) ELSE 1 END,
          window_start = EXCLUDED.window_start
        RETURNING attempts
      `,
        [keys[i]],
      );
      if (Number(rows[0].attempts) > limits[i]) {
        throw new HttpException(
          "Too many authentication attempts. Try again later.",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  async loginSucceeded(email: string): Promise<void> {
    // Successful authentication clears the account failure counter,
    // but does not clear the IP limit used to resist password spraying.
    await this.dataSource.query(
      "DELETE FROM iam.auth_rate_limits WHERE key = $1",
      [this.key(`login:account:${email.trim().toLowerCase()}`)],
    );
  }
}
