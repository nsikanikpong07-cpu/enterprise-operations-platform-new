import { AuditWriterService } from "../../audit/providers/audit-writer.service.js";
import { DataSource } from "typeorm";
import { AuthRateLimitService } from "./auth-rate-limit.service.js";
import { CompanyUser } from "../../iam/entities/company-user.entity.js";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "../../iam/entities/user.entity.js";
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from "../../iam/providers/password-hasher.provider.js";
import { LoginDto } from "../dto/login.dto.js";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,

    @InjectRepository(CompanyUser)
    private readonly memberships: Repository<CompanyUser>,

    @Inject(PASSWORD_HASHER)
    private readonly hasher: PasswordHasher,

    private readonly jwt: JwtService,
    private readonly rateLimit: AuthRateLimitService,
    private readonly audit: AuditWriterService,
    private readonly dataSource: DataSource,
  ) {}

  async login(dto: LoginDto, ip: string) {
    const email = dto.email.trim().toLowerCase();

    await this.rateLimit.consume("login", ip, email);

    // Select the hash explicitly because its column has select: false.
    const user = await this.users
      .createQueryBuilder("user")
      .addSelect(["user.passwordHash", "user.authVersion"])
      .where("LOWER(BTRIM(user.email)) = :email", { email })
      .getOne();

    let passwordMatches = false;

    try {
      passwordMatches = await this.hasher.verify(
        dto.password,
        user?.passwordHash?.startsWith("$argon2id$")
          ? user.passwordHash
          : await this.dummyHash(),
      );
    } catch {
      // A malformed stored hash must not grant access.
      passwordMatches = false;
    }

    if (
      !user ||
      user.status !== "active" ||
      !user.passwordHash.startsWith("$argon2id$") ||
      !passwordMatches
    ) {
      await this.audit.write(this.dataSource, {
        action: "login_failed",
        entityType: "user",
        entityId: user?.id,
        actorId: null,
      });
      throw new UnauthorizedException("Invalid email or password");
    }

    const membership = await this.memberships.findOne({
      where: { user: { id: user.id } },
      relations: { company: true },
    });
    if (
      membership &&
      (membership.status !== "active" || membership.company.status !== "active")
    ) {
      await this.audit.write(this.dataSource, {
        action: "login_failed",
        entityType: "user",
        entityId: user?.id,
        actorId: null,
      });
      throw new UnauthorizedException("Invalid email or password");
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      v: user.authVersion,
    });

    await this.rateLimit.loginSucceeded(email);

    await this.dataSource.transaction(async (manager) => {
      const rows = await manager.query(
        "SELECT id,status,auth_version FROM iam.users WHERE id=$1 FOR UPDATE",
        [user.id],
      );
      if (
        !rows[0] ||
        rows[0].status !== "active" ||
        rows[0].auth_version !== user.authVersion
      )
        throw new UnauthorizedException("Invalid email or password");
      await manager.query(
        "UPDATE iam.users SET last_login_at=now(),updated_at=now() WHERE id=$1",
        [user.id],
      );
      await this.audit.write(manager, {
        action: "login_succeeded",
        entityType: "user",
        entityId: user.id,
        actorId: user.id,
        companyId: membership?.company.id,
      });
    });

    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn: 900,
      // Staff have one workspace; vendor/platform logins may have none.
      companyId: membership?.company.id ?? null,
      companyUserId: membership?.id ?? null,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  private dummy?: Promise<string>;
  private dummyHash(): Promise<string> {
    // Unknown accounts perform Argon2 verification too; no quick-exit leak.
    return (this.dummy ??= this.hasher.hash(
      "dummy-account-password-not-used-for-login",
    ));
  }
}
