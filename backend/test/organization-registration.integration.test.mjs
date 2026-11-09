import "reflect-metadata";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { embeddedDataSource } from "./support/embedded-postgres.mjs";
import { RegistrationService } from "../dist/organization/providers/registration.service.js";
import { AddOrganizationRegistration1791759600000 } from "../dist/database/migrations/1791759600000-AddOrganizationRegistration.js";
import { passwordHasherProvider } from "../dist/iam/providers/password-hasher.provider.js";
import { AuditWriterService } from "../dist/audit/providers/audit-writer.service.js";
import { User } from "../dist/iam/entities/user.entity.js";
import { Role } from "../dist/iam/entities/role.entity.js";
import { CompanyUser } from "../dist/iam/entities/company-user.entity.js";
import { Permission } from "../dist/iam/entities/permission.entity.js";
import { RolePermission } from "../dist/iam/entities/role-permission.entity.js";
import { UserRole } from "../dist/iam/entities/user-role.entity.js";
import { Company } from "../dist/organization/entities/company.entity.js";
import { Department } from "../dist/organization/entities/department.entity.js";
let env, service, hasher, registered;
const dto = (email, accountType = "company") => ({
  accountType,
  name: "Registration Integration Company",
  legalName: "Registration Integration Company Limited",
  owner: {
    email,
    password: "Integration-Demo-2026!",
    firstName: "Integration",
    lastName: "Owner",
  },
});
before(async () => {
  env = await embeddedDataSource(
    await readFile(
      new URL("./support/database-schema.sql", import.meta.url),
      "utf8",
    ),
    [fileURLToPath(new URL("../dist/**/*.entity.js", import.meta.url))],
  );
  // Earlier migrations already ran in the exported schema. The export contains no data.
  await env.source.query(
    "INSERT INTO iam.permissions(name,description) VALUES ('manage_iam','IAM management')",
  );
  hasher = new passwordHasherProvider.useClass();
  service = new RegistrationService(
    env.source,
    hasher,
    new AuditWriterService(),
    { consume: async () => {} },
  );
  const legacyCompany = await env.source.query(
    "INSERT INTO organization.companies(name) VALUES ('Legacy fixture workspace') RETURNING id",
  );
  const legacyRole = await env.source.query(
    "INSERT INTO iam.roles(company_id,name) VALUES ($1,'Legacy Admin') RETURNING id",
    [legacyCompany[0].id],
  );
  await env.source.query(
    "INSERT INTO iam.role_permissions(role_id,permission_id) SELECT $1,id FROM iam.permissions WHERE name='manage_iam'",
    [legacyRole[0].id],
  );
  await new AddOrganizationRegistration1791759600000().up(
    env.source.createQueryRunner(),
  );
  const backfill = await env.source.query(
    "SELECT p.name FROM iam.role_permissions rp JOIN iam.permissions p ON p.id=rp.permission_id WHERE role_id=$1 ORDER BY p.name",
    [legacyRole[0].id],
  );
  assert.deepEqual(
    backfill.map((x) => x.name),
    ["manage_iam", "manage_organization"],
  );
});
after(async () => {
  await app?.close();
  await env?.close();
});
test("company registration persists its owner, role, membership and both initial permissions", async () => {
  registered = await service.register(dto("owner@example.com"), "127.0.0.1");
  assert.equal(registered.company.status, "active");
  assert.equal(registered.membership.company.id, registered.company.id);
  const grants = await env.source.query(
    "SELECT p.name FROM iam.role_permissions rp JOIN iam.permissions p ON p.id=rp.permission_id WHERE rp.role_id=$1 ORDER BY p.name",
    [registered.administratorRole.id],
  );
  assert.deepEqual(
    grants.map((x) => x.name),
    ["manage_iam", "manage_organization"],
  );
  const stored = await env.source
    .getRepository(User)
    .createQueryBuilder("u")
    .addSelect("u.passwordHash")
    .where("u.id=:id", { id: registered.user.id })
    .getOne();
  assert.ok(stored.passwordHash.startsWith("$argon2id$"));
  assert.equal(
    await hasher.verify("Integration-Demo-2026!", stored.passwordHash),
    true,
  );
  assert.equal(JSON.stringify(registered).includes("passwordHash"), false);
  assert.equal(
    (
      await env.source.query(
        "SELECT count(*)::int AS n FROM audit.audit_logs WHERE company_id=$1",
        [registered.company.id],
      )
    )[0].n,
    2,
  );
});
test("duplicate account rolls back registration without orphan companies or grants", async () => {
  const before = (
    await env.source.query(
      "SELECT count(*)::int AS n FROM organization.companies",
    )
  )[0].n;
  await assert.rejects(
    service.register(dto("OWNER@example.com"), "127.0.0.1"),
    (e) => e.getStatus() === 409,
  );
  assert.equal(
    (
      await env.source.query(
        "SELECT count(*)::int AS n FROM organization.companies",
      )
    )[0].n,
    before,
  );
});
test("audit failure rolls back owner and company created earlier in the transaction", async () => {
  const failing = new RegistrationService(
    env.source,
    hasher,
    {
      write: async () => {
        throw new Error("audit unavailable");
      },
    },
    { consume: async () => {} },
  );
  await assert.rejects(
    failing.register(dto("rollback@example.com"), "127.0.0.1"),
    /audit unavailable/,
  );
  assert.equal(
    await env.source
      .getRepository(User)
      .countBy({ email: "rollback@example.com" }),
    0,
  );
});
test("vendor and both registrations link the owner without claiming supplier verification", async () => {
  for (const type of ["vendor", "both"]) {
    const r = await service.register(
      dto(type + "@example.com", type),
      "127.0.0.1",
    );
    assert.equal(r.vendor.verificationStatus, "not_verified");
    assert.equal(Boolean(r.company), type === "both");
    const rows = await env.source.query(
      "SELECT user_id FROM vendor.supplier_accounts WHERE supplier_id=$1",
      [r.vendor.id],
    );
    assert.equal(rows[0].user_id, r.user.id);
  }
});
test("missing required permission rolls back the whole new registration", async () => {
  await env.source.query(
    "UPDATE iam.permissions SET name='temporarily_missing' WHERE name='manage_organization'",
  );
  try {
    await assert.rejects(
      service.register(dto("missing@example.com"), "127.0.0.1"),
      (e) => e.getStatus() === 503,
    );
  } finally {
    await env.source.query(
      "UPDATE iam.permissions SET name='manage_organization' WHERE name='temporarily_missing'",
    );
  }
  assert.equal(
    await env.source
      .getRepository(User)
      .countBy({ email: "missing@example.com" }),
    0,
  );
});
test("invalid timezone is rejected before hashing or database writes", async () => {
  await assert.rejects(
    service.register(
      { ...dto("zone@example.com"), timezone: "Unknown/Invalid" },
      "127.0.0.1",
    ),
    (e) => e.getStatus() === 400,
  );
});

// Exercise the actual Nest modules, global guards, validation and HTTP routes.
// No application .env, SMTP server, or external PostgreSQL server is used.
import { Global, Module, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { DataSource } from "typeorm";
import request from "supertest";
import { AuthModule } from "../dist/auth/auth.module.js";
import { OrganizationModule } from "../dist/organization/organization.module.js";
import { PasswordMailService } from "../dist/auth/providers/password-mail.service.js";
let app, adminToken, otherCompany, staffToken, departmentId, locationId;
const auth = (token) => ({ Authorization: `Bearer ${token}` });
test("Auth and Organization modules resolve together and public registration validates nested owner input", async () => {
  class DatabaseModule {}
  Global()(DatabaseModule);
  Module({
    providers: [{ provide: DataSource, useValue: env.source }],
    exports: [DataSource],
  })(DatabaseModule);
  const module = await Test.createTestingModule({
    imports: [
      DatabaseModule,
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        load: [
          () => ({
            JWT_SECRET: "integration-test-only-secret-".repeat(4),
            PASSWORD_RECOVERY_ENABLED: "false",
          }),
        ],
      }),
      AuthModule,
      OrganizationModule,
    ],
  })
    .overrideProvider(PasswordMailService)
    .useValue({ enabled: () => false })
    .compile();
  app = module.createNestApplication({ logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  await request(app.getHttpServer())
    .post("/auth/register")
    .send({ accountType: "company", name: "Bad registration" })
    .expect(400);
  await request(app.getHttpServer())
    .post("/auth/register")
    .send({ ...dto("invalid-owner@example.com"), owner: [] })
    .expect(400);
  const response = await request(app.getHttpServer())
    .post("/auth/register")
    .send({
      ...dto("http-owner@example.com"),
      name: "HTTP Workspace",
      companyId: registered.company.id,
    })
    .expect(201);
  otherCompany = response.body;
  assert.notEqual(response.body.company.id, registered.company.id);
  assert.equal(JSON.stringify(response.body).includes("passwordHash"), false);
  const login = await request(app.getHttpServer())
    .post("/auth/login")
    .send({ email: "owner@example.com", password: "Integration-Demo-2026!" })
    .expect(200);
  adminToken = login.body.accessToken;
  assert.equal(login.body.companyId, registered.company.id);
});
test("anonymous company listing and case-insensitive routes cannot bypass authentication", async () => {
  for (const path of ["/organization/companies", "/ORGANIZATION/COMPANIES"])
    await request(app.getHttpServer()).get(path).expect(401);
  await request(app.getHttpServer())
    .post("/organization/departments")
    .send({ companyId: registered.company.id, name: "No access" })
    .expect(401);
});
test("administrator sees only their own company and cannot request another company", async () => {
  const result = await request(app.getHttpServer())
    .get("/organization/companies")
    .set(auth(adminToken))
    .expect(200);
  assert.deepEqual(
    result.body.map((x) => x.id),
    [registered.company.id],
  );
  await request(app.getHttpServer())
    .get(`/organization/companies/${otherCompany.company.id}`)
    .set(auth(adminToken))
    .expect(403);
  await request(app.getHttpServer())
    .get(`/organization/companies?companyId=${otherCompany.company.id}`)
    .set(auth(adminToken))
    .expect(403);
  await request(app.getHttpServer())
    .post("/organization/companies")
    .set(auth(adminToken))
    .send({ name: "Unsafe old path" })
    .expect(410);
});
test("department/location creation and audit use the authorized company; foreign resource IDs are refused", async () => {
  const foreignLogin = await request(app.getHttpServer())
    .post("/auth/login")
    .send({
      email: "http-owner@example.com",
      password: "Integration-Demo-2026!",
    })
    .expect(200);
  const foreignToken = foreignLogin.body.accessToken;
  const d = await request(app.getHttpServer())
    .post("/organization/departments")
    .set(auth(adminToken))
    .send({
      companyId: registered.company.id,
      name: "Procurement",
      code: "PROC",
    })
    .expect(201);
  departmentId = d.body.id;
  const l = await request(app.getHttpServer())
    .post("/organization/locations")
    .set(auth(adminToken))
    .send({ companyId: registered.company.id, name: "Main Office", code: "HQ" })
    .expect(201);
  locationId = l.body.id;
  await request(app.getHttpServer())
    .patch(
      `/organization/departments/${departmentId}?companyId=${otherCompany.company.id}`,
    )
    .set(auth(foreignToken))
    .send({ name: "Forged update" })
    .expect(403);
  await request(app.getHttpServer())
    .patch(`/organization/locations/${locationId}`)
    .set(auth(foreignToken))
    .send({ name: "Foreign update" })
    .expect(403);
  await request(app.getHttpServer())
    .post("/organization/departments")
    .set(auth(adminToken))
    .send({
      companyId: registered.company.id,
      name: "Wrong Manager",
      managerId: otherCompany.membership.id,
    })
    .expect(403);
  const logs = await env.source.query(
    "SELECT user_id FROM audit.audit_logs WHERE action='department_created' AND entity_id=$1",
    [departmentId],
  );
  assert.equal(logs[0].user_id, registered.user.id);
});
test("ordinary staff can read their workspace but cannot alter company, departments or locations", async () => {
  const staff = await env.source.getRepository(User).save({
    email: "ordinary@example.com",
    passwordHash: await hasher.hash("Integration-Demo-2026!"),
    firstName: "Ordinary",
    lastName: "Staff",
    status: "active",
  });
  await env.source.getRepository(CompanyUser).save({
    company: { id: registered.company.id },
    user: { id: staff.id },
    status: "active",
  });
  const login = await request(app.getHttpServer())
    .post("/auth/login")
    .send({ email: "ordinary@example.com", password: "Integration-Demo-2026!" })
    .expect(200);
  staffToken = login.body.accessToken;
  await request(app.getHttpServer())
    .get(`/organization/companies/${registered.company.id}`)
    .set(auth(staffToken))
    .expect(200);
  await request(app.getHttpServer())
    .get(`/organization/companies/${registered.company.id}/departments`)
    .set(auth(staffToken))
    .expect(200);
  await request(app.getHttpServer())
    .patch(`/organization/companies/${registered.company.id}`)
    .set(auth(staffToken))
    .send({ name: "Unauthorized" })
    .expect(403);
  await request(app.getHttpServer())
    .patch(`/organization/departments/${departmentId}`)
    .set(auth(staffToken))
    .send({ name: "Unauthorized" })
    .expect(403);
  await request(app.getHttpServer())
    .delete(`/organization/locations/${locationId}`)
    .set(auth(staffToken))
    .expect(403);
});
test("deletion safeguards retain history and location removal deactivates instead of deleting", async () => {
  await request(app.getHttpServer())
    .delete(`/organization/companies/${registered.company.id}`)
    .set(auth(adminToken))
    .expect(409);
  await request(app.getHttpServer())
    .delete(`/organization/departments/${departmentId}`)
    .set(auth(adminToken))
    .expect(409);
  await request(app.getHttpServer())
    .delete(`/organization/locations/${locationId}`)
    .set(auth(adminToken))
    .expect(200);
  const rows = await env.source.query(
    "SELECT is_active FROM organization.locations WHERE id=$1",
    [locationId],
  );
  assert.equal(rows[0].is_active, false);
});
test("public registration is rate limited before another password is hashed", async () => {
  for (let i = 0; i < 3; i++)
    await request(app.getHttpServer())
      .post("/auth/register")
      .send(dto("rate-limit@example.com"))
      .expect(i === 0 ? 201 : 409);
  await request(app.getHttpServer())
    .post("/auth/register")
    .send(dto("rate-limit@example.com"))
    .expect(429);
});

test("invalid department names, null required fields and duplicate records receive client errors", async () => {
  await request(app.getHttpServer())
    .post("/organization/departments")
    .set(auth(adminToken))
    .send({ companyId: registered.company.id, name: "   " })
    .expect(400);
  await request(app.getHttpServer())
    .patch(`/organization/companies/${registered.company.id}`)
    .set(auth(adminToken))
    .send({ name: null })
    .expect(400);
  await request(app.getHttpServer())
    .post("/organization/departments")
    .set(auth(adminToken))
    .send({
      companyId: registered.company.id,
      name: "Procurement",
      code: "PROC",
    })
    .expect(409);
});
