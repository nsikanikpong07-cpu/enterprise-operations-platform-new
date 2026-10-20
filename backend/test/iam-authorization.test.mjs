import "reflect-metadata";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { Test } from "@nestjs/testing";
import { APP_GUARD } from "@nestjs/core";
import {
  UnauthorizedException,
  ForbiddenException,
  ValidationPipe,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import request from "supertest";
import { IamAccessGuard } from "../dist/auth/guards/iam-access.guard.js";
import { JwtAuthGuard } from "../dist/auth/guards/jwt-auth.guard.js";
import { RolesController } from "../dist/iam/controllers/roles.controller.js";
import { UsersController } from "../dist/iam/controllers/users.controller.js";
import { IamController } from "../dist/iam/controllers/iam.controller.js";
import { RolesService } from "../dist/iam/providers/roles.service.js";
import { UsersService } from "../dist/iam/providers/users.service.js";
import { IamService } from "../dist/iam/providers/iam.service.js";

// HTTP guard tests use controlled identities and repositories.
// They do not log into or modify your PostgreSQL database.
const companyA = "f952d153-49ee-46a0-998b-f912367679db";
const companyB = "3fe23182-d73f-4cbe-aec2-b284cb284861";
const userA = "ba46e2cb-1803-4e21-a016-4f159108e4a1";
const userB = "10d84969-b4ef-4fec-9dde-339a7a6ca88e";
const roleA = "a09676c9-0405-461a-957b-2f416a81e12b";
const roleB = "cdb1d11b-ee4a-4d86-9c01-6524f36f58a1";
const memberA = "49bf54fc-89f9-465c-a914-496e39b9259c";
const memberB = "045e0594-39e1-4c03-9ae1-3fc0f9d23499";
const role = (id) => ({
  id,
  company: { id: id === roleA ? companyA : companyB },
});
const member = (id) => ({
  id,
  company: { id: id === memberA ? companyA : companyB },
  status: "active",
});
const jwtGuard = {
  async canActivate(context) {
    const req = context.switchToHttp().getRequest();
    if (!["Bearer admin", "Bearer staff"].includes(req.headers.authorization)) {
      throw new UnauthorizedException("Bearer token is required");
    }
    req.user = {
      id: userA,
      kind: req.headers.authorization.endsWith("admin") ? "admin" : "staff",
    };
    return true;
  },
};
let currentPermission = "manage_iam";
const iam = {
  findRole: async (id) => role(id),
  findCompanyUser: async (id) => member(id),
  async requireActiveCompanyMembership(userId, companyId) {
    if (companyId !== companyA) throw new ForbiddenException("Wrong company");
    return member(memberA);
  },
  permissionsForCompanyUser: async () =>
    currentPermission ? [currentPermission] : [],
};
const guard = new IamAccessGuard(new Reflector(), jwtGuard, iam, {
  findOne: async (options) => ({
    company: { id: options.where.user.id === userA ? companyA : companyB },
  }),
});
const roles = {
  findAll: async (id) => [{ company: { id } }],
  findOne: async (id) => role(id),
  create: async (dto) => dto,
  update: async (id, dto) => ({ id, ...dto }),
  remove: async () => {},
  findPermissions: async () => ["manage_iam"],
  grantPermission: async (dto) => dto,
  rolePermissionsFor: async () => [],
  assignRole: async () => ({}),
  rolesForCompanyUser: async () => [],
  addCompanyUser: async (dto) => dto,
  findCompanyUsers: async () => [],
  findCompanyUser: async (id) => member(id),
  updateCompanyUser: async (id, dto) => ({ id, ...dto }),
  removeCompanyUser: async () => {},
};
const users = {
  findAll: async (companyId) => [{ id: userA, companyId }],
  findOne: async (id) => ({ id }),
  create: async (dto) => ({
    user: { id: userA, email: dto.email },
    membership: { id: memberA },
  }),
  update: async (id, dto) => ({ id, ...dto }),
  remove: async () => {},
  findCompanyUsers: async () => [],
  addToCompany: async (dto) => dto,
  updateCompanyUser: async () => ({}),
};
let app;
before(async () => {
  const module = await Test.createTestingModule({
    controllers: [RolesController, UsersController, IamController],
    providers: [
      { provide: RolesService, useValue: roles },
      { provide: UsersService, useValue: users },
      { provide: IamService, useValue: iam },
      { provide: APP_GUARD, useValue: guard },
    ],
  }).compile();
  app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
});
after(async () => {
  await app?.close();
});
const api = () => request(app.getHttpServer());

test("IAM rejects missing and invalid credentials", async () => {
  await api().get(`/iam/roles?companyId=${companyA}`).expect(401);
  await api()
    .get(`/iam/roles?companyId=${companyA}`)
    .set("Authorization", "Bearer invalid")
    .expect(401);
});
test("case-insensitive routes cannot bypass authentication", async () => {
  await api().get(`/IAM/roles?companyId=${companyA}`).expect(401);
});
test("administrator can list only the requested authorized company", async () => {
  const res = await api()
    .get(`/iam/roles?companyId=${companyA}`)
    .set("Authorization", "Bearer admin")
    .expect(200);
  assert.equal(res.body[0].company.id, companyA);
  await api()
    .get(`/iam/roles?companyId=${companyB}`)
    .set("Authorization", "Bearer admin")
    .expect(403);
});
test("active ordinary member is denied administrator endpoints", async () => {
  currentPermission = "";
  try {
    await api()
      .get(`/iam/roles?companyId=${companyA}`)
      .set("Authorization", "Bearer staff")
      .expect(403);
  } finally {
    currentPermission = "manage_iam";
  }
});
test("resource ownership comes from the database, not forged company context", async () => {
  await api()
    .get(`/iam/roles/${roleB}?companyId=${companyA}`)
    .set("Authorization", "Bearer admin")
    .expect(403);
  await api()
    .get(`/iam/roles/${roleB}`)
    .set("Authorization", "Bearer admin")
    .expect(403);
  await api()
    .patch(`/iam/users/${userB}`)
    .set("Authorization", "Bearer admin")
    .send({ firstName: "Changed" })
    .expect(403);
  await api()
    .patch(`/iam/company-users/${memberB}`)
    .set("Authorization", "Bearer admin")
    .send({ status: "inactive" })
    .expect(403);
});
test("company creation scope is validated before saving a role", async () => {
  await api()
    .post("/iam/roles")
    .set("Authorization", "Bearer admin")
    .send({ companyId: companyB, name: "Approver" })
    .expect(403);
  await api()
    .post("/iam/roles")
    .set("Authorization", "Bearer admin")
    .send({ name: "Approver" })
    .expect(400);
  await api()
    .post("/iam/roles")
    .set("Authorization", "Bearer admin")
    .send({ companyId: companyA, name: "Approver" })
    .expect(201);
});
test("membership and permission grant endpoints resolve their resource owners", async () => {
  await api()
    .post("/iam/roles/grant-permission")
    .set("Authorization", "Bearer admin")
    .send({ roleId: roleB, permissionId: roleA })
    .expect(403);
  await api()
    .get(`/iam/memberships/${memberB}/permissions`)
    .set("Authorization", "Bearer admin")
    .expect(403);
});
test("shared permission definitions cannot be created by company administrators", async () => {
  await api()
    .post(`/iam/permissions?companyId=${companyA}`)
    .set("Authorization", "Bearer admin")
    .send({ name: "invented_permission" })
    .expect(403);
});
test("staff creation requires company and password; response excludes password fields", async () => {
  await api()
    .post("/iam/users")
    .set("Authorization", "Bearer admin")
    .send({ email: "staff@example.com" })
    .expect(400);
  const res = await api()
    .post("/iam/users")
    .set("Authorization", "Bearer admin")
    .send({
      companyId: companyA,
      email: "staff@example.com",
      password: "Local-test-only-42!",
      firstName: "Test",
      lastName: "Staff",
    })
    .expect(201);
  assert.ok(res.body.user);
  assert.ok(res.body.membership);
  assert.equal(res.body.user.passwordHash, undefined);
  assert.equal(res.body.user.password, undefined);
});
test("JWT guard rejects malformed payload and inactive database user", async () => {
  const ctx = (req) => ({ switchToHttp: () => ({ getRequest: () => req }) });
  const valid = { sub: userA, v: 0, exp: Math.floor(Date.now() / 1000) + 100 };
  const inactive = new JwtAuthGuard(
    { verifyAsync: async () => valid },
    { findOne: async () => ({ id: userA, status: "inactive" }) },
  );
  await assert.rejects(
    inactive.canActivate(ctx({ headers: { authorization: "Bearer test" } })),
    UnauthorizedException,
  );
  const malformed = new JwtAuthGuard(
    { verifyAsync: async () => ({ sub: "bad", exp: 1 }) },
    { findOne: async () => null },
  );
  await assert.rejects(
    malformed.canActivate(ctx({ headers: { authorization: "Bearer test" } })),
    UnauthorizedException,
  );
});
test("assignRole refuses a cross-company role even if called directly", async () => {
  const service = Object.create(IamService.prototype);
  service.findCompanyUser = async () => member(memberA);
  service.findRole = async () => role(roleB);
  await assert.rejects(
    service.assignRole({ companyUserId: memberA, roleId: roleB }),
    ForbiddenException,
  );
});
test("atomic staff creation uses the transaction manager and propagates rollback errors", async () => {
  const service = Object.create(IamService.prototype);
  service.passwordHasher = { hash: async () => "$argon2id$test" };
  const saves = [];
  const manager = {
    findOneBy: async () => ({ id: companyA, status: "active" }),
    create: (_entity, data) => data,
    async save(entity, data) {
      saves.push(data);
      if (saves.length === 2) throw { code: "23505" };
      return { ...data, id: userA };
    },
  };
  let transactionRejected = false;
  service.dataSource = {
    async transaction(fn) {
      try {
        return await fn(manager);
      } catch (e) {
        transactionRejected = true;
        throw e;
      }
    },
  };
  await assert.rejects(
    service.createStaff({
      companyId: companyA,
      email: "a@example.com",
      password: "test",
      firstName: "A",
      lastName: "B",
    }),
    (error) => error.getStatus() === 409,
  );
  assert.equal(transactionRejected, true);
  assert.equal(saves.length, 2);
});
test("AuthModule and IamModule resolve without a circular dependency", async () => {
  const { AuthModule } = await import("../dist/auth/auth.module.js");
  const { DataSource } = await import("typeorm");
  const { Module, Global } = await import("@nestjs/common");
  const fakeDataSource = {
    entityMetadatas: [],
    options: { type: "postgres" },
    getRepository: () => ({}),
  };
  class TestDatabaseModule {}
  Global()(TestDatabaseModule);
  Module({
    providers: [{ provide: DataSource, useValue: fakeDataSource }],
    exports: [DataSource],
  })(TestDatabaseModule);
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "a".repeat(64);
  try {
    const module = await Test.createTestingModule({
      imports: [TestDatabaseModule, AuthModule],
    }).compile();
    assert.ok(module.get(IamService));
    await module.close();
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});
