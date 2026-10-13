import "reflect-metadata";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { auditContext } from "../dist/audit/providers/audit-context.js";
import { AuditWriterService } from "../dist/audit/providers/audit-writer.service.js";
import { AuditService } from "../dist/audit/providers/audit.service.js";
import { AuditLog } from "../dist/audit/entities/audit-log.entity.js";
import { IamService } from "../dist/iam/providers/iam.service.js";
import { getMetadataArgsStorage } from "typeorm";
const company = "f952d153-49ee-46a0-998b-f912367679db";
const user = "ba46e2cb-1803-4e21-a016-4f159108e4a1";
const other = "3fe23182-d73f-4cbe-aec2-b284cb284861";
const writer = new AuditWriterService();

test("writer uses an allowlist and never persists password/token/internal version fields", async () => {
  let parameters;
  await writer.write(
    {
      query: async (_sql, args) => {
        parameters = args;
      },
    },
    {
      action: "test",
      entityType: "role",
      companyId: company,
      newValues: {
        status: "active",
        password: "PRIVATE-PASSWORD",
        passwordHash: "PRIVATE-HASH",
        accessToken: "PRIVATE-TOKEN",
        authVersion: 4,
        credentials: { password: "PRIVATE-NESTED" },
      },
    },
  );
  const text = JSON.stringify(parameters);
  assert.ok(!text.includes("PRIVATE-"));
  assert.deepEqual(JSON.parse(parameters[6]), { status: "active" });
});
test("request identity, company and valid IP are recorded without raw request bodies", async () => {
  let parameters;
  await auditContext.run(
    {
      actorId: user,
      companyId: company,
      ip: "127.0.0.1",
      userAgent: "Test Client",
    },
    () =>
      writer.write(
        {
          query: async (_sql, args) => {
            parameters = args;
          },
        },
        { action: "staff_updated", entityType: "user", entityId: user },
      ),
  );
  assert.equal(parameters[0], company);
  assert.equal(parameters[1], user);
  assert.equal(parameters[7], "127.0.0.1");
  assert.equal(parameters[8], "Test Client");
});
test("concurrent AsyncLocalStorage request contexts remain isolated", async () => {
  const rows = [];
  await Promise.all(
    [company, other].map((id, index) =>
      auditContext.run(
        { companyId: id, actorId: index ? undefined : user },
        async () => {
          await new Promise((resolve) => setTimeout(resolve, index ? 1 : 5));
          await writer.write(
            {
              query: async (_sql, args) => {
                rows.push(args);
              },
            },
            { action: "test", entityType: "role" },
          );
        },
      ),
    ),
  );
  assert.equal(rows.find((r) => r[0] === company)[1], user);
  assert.equal(rows.find((r) => r[0] === other)[1], null);
});
test("public recovery events preserve anonymous actor while resolving the target workspace", async () => {
  let parameters;
  const manager = {
    query: async (sql, args) => {
      if (sql.startsWith("SELECT")) return [{ company_id: company }];
      parameters = args;
      return [];
    },
  };
  await writer.write(manager, {
    action: "password_recovery_requested",
    entityType: "user",
    entityId: user,
    actorId: null,
  });
  assert.equal(parameters[0], company);
  assert.equal(parameters[1], null);
  assert.equal(parameters[4], user);
});
test("invalid IP values cannot break PostgreSQL inet inserts", async () => {
  let parameters;
  await auditContext.run({ ip: "not-an-ip", companyId: company }, () =>
    writer.write(
      {
        query: async (_sql, args) => {
          parameters = args;
        },
      },
      { action: "test", entityType: "role" },
    ),
  );
  assert.equal(parameters[7], null);
});
test("audit entity matches append-only snake_case schema without updated_at", async () => {
  const columns = getMetadataArgsStorage().columns.filter(
    (c) => c.target === AuditLog,
  );
  assert.ok(columns.some((c) => c.options.name === "entity_type"));
  assert.ok(columns.some((c) => c.options.name === "created_at"));
  assert.ok(!columns.some((c) => c.propertyName === "updatedAt"));
});
test("audit service refuses an unscoped global read", async () => {
  const service = new AuditService({ find: async () => [] }, {}, writer);
  assert.throws(() => service.findAll({}), BadRequestException);
  const result = await service.findAll({ companyId: company });
  assert.deepEqual(result, []);
});
test("audit insertion failure rolls back combined staff creation", async () => {
  const service = Object.create(IamService.prototype);
  let committed = [];
  service.passwordHasher = { hash: async () => "$argon2id$test" };
  service.audit = {
    write: async () => {
      throw new Error("Audit insert failed");
    },
  };
  service.dataSource = {
    transaction: async (fn) => {
      const pending = [];
      const manager = {
        findOneBy: async () => ({ id: company, status: "active" }),
        create: (_entity, value) => value,
        save: async (_entity, value) => {
          pending.push(value);
          return { ...value, id: user };
        },
      };
      const result = await fn(manager);
      committed = pending;
      return result;
    },
  };
  await assert.rejects(
    service.createStaff({
      companyId: company,
      email: "test@example.com",
      password: "long-demo-password",
      firstName: "Test",
      lastName: "Staff",
    }),
    /Audit insert failed/,
  );
  assert.equal(committed.length, 0);
});
test("audit read API rejects anonymous/cross-company requests and returns no credentials", async () => {
  const { Test } = await import("@nestjs/testing");
  const { APP_GUARD, Reflector } = await import("@nestjs/core");
  const { default: request } = await import("supertest");
  const { AuditController } =
    await import("../dist/audit/controllers/audit.controller.js");
  const { IamAccessGuard } =
    await import("../dist/auth/guards/iam-access.guard.js");
  const guard = new IamAccessGuard(
    new Reflector(),
    {
      async canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        if (req.headers.authorization !== "Bearer admin")
          throw new UnauthorizedException();
        req.user = { id: user };
        return true;
      },
    },
    {
      requireActiveCompanyMembership: async (_u, c) => {
        if (c !== company) throw new ForbiddenException();
        return { id: "member", status: "active", company: { id: c } };
      },
      permissionsForCompanyUser: async () => ["manage_iam"],
    },
    {},
  );
  const module = await Test.createTestingModule({
    controllers: [AuditController],
    providers: [
      { provide: APP_GUARD, useValue: guard },
      {
        provide: AuditService,
        useValue: {
          findAll: async () => [
            { action: "staff_updated", company: { id: company } },
          ],
        },
      },
    ],
  }).compile();
  const app = module.createNestApplication();
  await app.init();
  try {
    const api = request(app.getHttpServer());
    await api.get(`/audit/logs?companyId=${company}`).expect(401);
    await api
      .get("/audit/logs")
      .set("Authorization", "Bearer admin")
      .expect(400);
    await api
      .get(`/audit/logs?companyId=${other}`)
      .set("Authorization", "Bearer admin")
      .expect(403);
    const res = await api
      .get(`/audit/logs?companyId=${company}`)
      .set("Authorization", "Bearer admin")
      .expect(200);
    assert.equal(res.body[0].company.id, company);
    assert.equal(res.body[0].passwordHash, undefined);
  } finally {
    await app.close();
  }
});
test("omitted DTO fields neither overwrite staff state nor appear as changed audit fields", async () => {
  const service = Object.create(IamService.prototype);
  let event;
  service.companyUsers = {
    findOne: async () => ({ company: { id: company } }),
  };
  service.adminAccessPolicy = {
    change: async (_id, fn) =>
      fn({
        findOneBy: async () => ({
          id: user,
          status: "active",
          firstName: "Auth",
          lastName: "Demo",
        }),
        save: async (_entity, value) => value,
      }),
  };
  service.audit = {
    write: async (_manager, value) => {
      event = value;
    },
  };
  const result = await service.updateUser(user, {
    firstName: "Updated",
    status: undefined,
    lastName: undefined,
  });
  assert.equal(result.status, "active");
  assert.equal(result.lastName, "Demo");
  assert.deepEqual(event.newValues.changedFields, ["firstName"]);
});
