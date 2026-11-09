const auditStub = { write: async () => {} };
const authSourceStub = {
  transaction: async (fn) =>
    fn({
      query: async (sql) =>
        sql.startsWith("SELECT")
          ? [
              {
                id: "ba46e2cb-1803-4e21-a016-4f159108e4a1",
                status: "active",
                auth_version: 2,
              },
            ]
          : [],
    }),
};
import "reflect-metadata";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadRequestException,
  UnauthorizedException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { JwtAuthGuard } from "../dist/auth/guards/jwt-auth.guard.js";
import { AuthService } from "../dist/auth/providers/auth.service.js";
import { AuthRateLimitService } from "../dist/auth/providers/auth-rate-limit.service.js";
import { PasswordSecurityService } from "../dist/auth/providers/password-security.service.js";
import { PasswordMailService } from "../dist/auth/providers/password-mail.service.js";
import { ResetPasswordDto } from "../dist/auth/dto/password.dto.js";

const id = "ba46e2cb-1803-4e21-a016-4f159108e4a1";
const context = (req) => ({ switchToHttp: () => ({ getRequest: () => req }) });
const req = () => ({ headers: { authorization: "Bearer test" } });
const payload = { sub: id, exp: Math.floor(Date.now() / 1000) + 900, v: 2 };
const active = {
  id,
  email: "auth.demo@example.com",
  status: "active",
  authVersion: 2,
};
const hasher = {
  hash: async (p) => `$argon2id$test-${p}`,
  verify: async (p, h) => h === `$argon2id$test-${p}`,
};
const limits = { consume: async () => {} };

test("old tokens without a revocation version are rejected", async () => {
  const g = new JwtAuthGuard(
    { verifyAsync: async () => ({ sub: id, exp: payload.exp }) },
    { findOne: async () => active },
  );
  await assert.rejects(g.canActivate(context(req())), UnauthorizedException);
});
test("current token version succeeds without exposing internal version/hash", async () => {
  const g = new JwtAuthGuard(
    { verifyAsync: async () => payload },
    { findOne: async () => active },
  );
  const r = req();
  await g.canActivate(context(r));
  assert.equal(r.tokenVersion, 2);
  assert.equal(r.user.authVersion, undefined);
  assert.equal(r.user.passwordHash, undefined);
});
test("revoked token version fails even before its normal expiry", async () => {
  const g = new JwtAuthGuard(
    { verifyAsync: async () => ({ ...payload, v: 1 }) },
    { findOne: async () => active },
  );
  await assert.rejects(g.canActivate(context(req())), UnauthorizedException);
});
test("unknown login still verifies a dummy Argon2 hash and returns generic 401", async () => {
  let verified = false;
  const repository = {
    createQueryBuilder: () => ({
      addSelect() {
        return this;
      },
      where() {
        return this;
      },
      getOne: async () => null,
    }),
  };
  const auth = new AuthService(
    repository,
    {},
    {
      hash: hasher.hash,
      verify: async () => {
        verified = true;
        return false;
      },
    },
    {},
    limits,
    auditStub,
    authSourceStub,
  );
  await assert.rejects(
    auth.login(
      { email: "missing@example.com", password: "not-a-password" },
      "127.0.0.1",
    ),
    UnauthorizedException,
  );
  assert.equal(verified, true);
});
test("login signs the current account version and keeps credentials out of response", async () => {
  const user = {
    ...active,
    firstName: "Auth",
    lastName: "Demo",
    passwordHash: "$argon2id$test-correct",
  };
  let signed;
  const repo = {
    createQueryBuilder: () => ({
      addSelect() {
        return this;
      },
      where() {
        return this;
      },
      getOne: async () => user,
    }),
    update: async () => {},
  };
  const auth = new AuthService(
    repo,
    { findOne: async () => null },
    hasher,
    {
      signAsync: async (p) => {
        signed = p;
        return "test-token";
      },
    },
    { ...limits, loginSucceeded: async () => {} },
    auditStub,
    authSourceStub,
  );
  const res = await auth.login(
    { email: user.email, password: "correct" },
    "127.0.0.1",
  );
  assert.deepEqual(signed, { sub: id, v: 2 });
  assert.equal(res.user.passwordHash, undefined);
  assert.equal(res.user.authVersion, undefined);
});
test("rate limits are persistent and key values do not expose email/IP", async () => {
  const values = [];
  let n = 0;
  const rate = new AuthRateLimitService(
    {
      query: async (sql, args) => {
        values.push(args[0]);
        return [{ attempts: ++n === 1 ? 1 : 9 }];
      },
    },
    { getOrThrow: () => "x".repeat(64) },
  );
  await assert.rejects(
    rate.consume("login", "127.0.0.1", "auth.demo@example.com"),
    (e) => e.getStatus() === 429,
  );
  assert.equal(values.length, 2);
  assert.ok(values.every((v) => /^[a-f0-9]{64}$/.test(v)));
});
test("unconfigured recovery fails uniformly before account lookup", async () => {
  let queried = false;
  const s = new PasswordSecurityService(
    {
      query: async () => {
        queried = true;
      },
    },
    hasher,
    limits,
    {
      settings: () => {
        throw new ServiceUnavailableException();
      },
    },
    auditStub,
  );
  await assert.rejects(
    s.forgot("a@example.com", "127.0.0.1"),
    ServiceUnavailableException,
  );
  assert.equal(queried, false);
});
test("recovery response is generic and only a digest plus encrypted mail payload are stored", async () => {
  const writes = [];
  let token;
  const mail = {
    settings: () => ({}),
    encrypt: (_email, t) => {
      token = t;
      return "encrypted-payload";
    },
  };
  const source = {
    query: async () => [{ id, status: "active", auth_version: 2 }],
    transaction: async (fn) =>
      fn({
        query: async (sql, args) => {
          writes.push({ sql, args });
        },
      }),
  };
  const s = new PasswordSecurityService(
    source,
    hasher,
    limits,
    mail,
    auditStub,
  );
  const known = await s.forgot("auth.demo@example.com", "127.0.0.1");
  source.query = async () => [];
  const unknown = await s.forgot("missing@example.com", "127.0.0.1");
  assert.deepEqual(known, unknown);
  assert.equal(known.token, undefined);
  assert.equal(token.length, 43);
  assert.match(writes[0].args[1], /^[a-f0-9]{64}$/);
  assert.notEqual(writes[0].args[1], token);
  assert.equal(writes[1].args[0], "encrypted-payload");
});
function resetFixture({ expired = false } = {}) {
  let used = false;
  let version = 2;
  const writes = [];
  const manager = {
    query: async (sql, args) => {
      if (sql.startsWith("SELECT id,status,auth_version"))
        return [{ id, status: "active", auth_version: version }];
      if (sql.includes("SELECT id,auth_version FROM iam.password_reset_tokens"))
        return used || expired ? [] : [{ id: "reset", auth_version: 2 }];
      writes.push(sql);
      if (sql.startsWith("UPDATE iam.users")) version++;
      if (sql.startsWith("UPDATE iam.password_reset_tokens")) used = true;
      return [];
    },
  };
  const source = {
    query: async () => [{ user_id: id }],
    transaction: async (fn) => fn(manager),
  };
  return {
    service: new PasswordSecurityService(source, hasher, limits, {}, auditStub),
    writes,
    version: () => version,
  };
}
test("reset consumes its token and increments version; reuse is rejected", async () => {
  const f = resetFixture();
  await f.service.reset("a".repeat(43), "a-new-long-password", "127.0.0.1");
  assert.equal(f.version(), 3);
  await assert.rejects(
    f.service.reset("a".repeat(43), "another-long-password", "127.0.0.1"),
    BadRequestException,
  );
});
test("expired reset token cannot change a password", async () => {
  const f = resetFixture({ expired: true });
  await assert.rejects(
    f.service.reset("a".repeat(43), "new-long-password", "127.0.0.1"),
    BadRequestException,
  );
  assert.equal(f.writes.length, 0);
});
test("password change requires current password and token version", async () => {
  const writes = [];
  const source = {
    transaction: async (fn) =>
      fn({
        query: async (sql) => {
          if (sql.startsWith("SELECT"))
            return [
              {
                id,
                status: "active",
                auth_version: 2,
                password_hash: "$argon2id$test-correct",
              },
            ];
          writes.push(sql);
          return [];
        },
      }),
  };
  const s = new PasswordSecurityService(source, hasher, limits, {}, auditStub);
  await assert.rejects(
    s.change(id, 2, "wrong", "new-password-123", "127.0.0.1"),
    BadRequestException,
  );
  await assert.rejects(
    s.change(id, 1, "correct", "new-password-123", "127.0.0.1"),
    UnauthorizedException,
  );
  assert.equal(writes.length, 0);
  await s.change(id, 2, "correct", "new-password-123", "127.0.0.1");
  assert.equal(writes.length, 3);
});
test("logout uses compare-and-swap account version and rejects an already revoked session", async () => {
  let version = 2;
  const s = new PasswordSecurityService(
    {
      transaction: async function (fn) {
        return fn(this);
      },
      query: async (_sql, args) => {
        if (args[1] !== version) return [];
        version++;
        return [{ id }];
      },
    },
    hasher,
    limits,
    {},
    auditStub,
  );
  await s.logout(id, 2);
  assert.equal(version, 3);
  await assert.rejects(s.logout(id, 2), UnauthorizedException);
});
const mailConfig = {
  PASSWORD_RECOVERY_ENABLED: "true",
  PASSWORD_RESET_MAIL_KEY: "a".repeat(64),
  SMTP_HOST: "smtp.example.com",
  SMTP_USER: "fake-test-user",
  SMTP_PASSWORD: "fake-test-password",
  SMTP_FROM: "test@example.com",
  PASSWORD_RESET_URL: "https://example.com/reset-password",
  SMTP_PORT: "587",
  NODE_ENV: "production",
};
test("mail payload encryption is authenticated and does not contain the plaintext token", async () => {
  const mail = new PasswordMailService({}, { get: (key) => mailConfig[key] });
  const token = "b".repeat(43);
  const payload = mail.encrypt("test@example.com", token);
  assert.equal(payload.includes(token), false);
  assert.deepEqual(mail.decrypt(payload), { email: "test@example.com", token });
  const bytes = Buffer.from(payload, "base64");
  bytes[30] ^= 1;
  assert.throws(() => mail.decrypt(bytes.toString("base64")));
});
test("production reset links cannot use plain HTTP", async () => {
  const mail = new PasswordMailService(
    {},
    {
      get: (key) =>
        ({
          ...mailConfig,
          PASSWORD_RESET_URL: "http://example.com/reset-password",
        })[key],
    },
  );
  assert.throws(() => mail.settings(), ServiceUnavailableException);
});
test("reset DTO rejects weak new passwords and malformed tokens", async () => {
  const errors = await validate(
    plainToInstance(ResetPasswordDto, { token: "bad", newPassword: "short" }),
  );
  assert.equal(errors.length, 2);
  const valid = await validate(
    plainToInstance(ResetPasswordDto, {
      token: "a".repeat(43),
      newPassword: "Long-demo-password-2026!",
    }),
  );
  assert.equal(valid.length, 0);
});
