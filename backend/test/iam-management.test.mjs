import "reflect-metadata";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { AdminAccessPolicyService } from "../dist/iam/providers/admin-access-policy.service.js";
import { IamService } from "../dist/iam/providers/iam.service.js";
import { UsersService } from "../dist/iam/providers/users.service.js";
import { RolesService } from "../dist/iam/providers/roles.service.js";
import { RolesController } from "../dist/iam/controllers/roles.controller.js";
import { IAM_SCOPE_KEY } from "../dist/auth/decorators/iam-scope.decorator.js";

const companyId = "f952d153-49ee-46a0-998b-f912367679db";
// Controlled transaction fixture simulates commit/rollback and row-lock ordering.
// These tests do not connect to the developer's PostgreSQL database.
function fixture(initial) {
  let committed = initial;
  let tail = Promise.resolve();
  const calls = [];
  const source = {
    async transaction(operation) {
      let release;
      const previous = tail;
      tail = new Promise((resolve) => {
        release = resolve;
      });
      let working;
      const manager = {
        async findOne(_entity, options) {
          calls.push(options);
          await previous;
          working = committed;
          return { id: companyId };
        },
        async query(sql, values) {
          assert.match(sql, /COUNT\(DISTINCT cu.user_id\)/);
          assert.match(sql, /r.company_id = cu.company_id/);
          assert.match(sql, /p.name = 'manage_iam'/);
          assert.deepEqual(values, [companyId]);
          return [{ count: working }];
        },
        reduce() {
          working--;
        },
      };
      try {
        const result = await operation(manager);
        committed = working;
        return result;
      } finally {
        release();
      }
    },
  };
  return {
    policy: new AdminAccessPolicyService(source),
    count: () => committed,
    calls,
  };
}
test("last active administrator change returns 409 and rolls back", async () => {
  const f = fixture(1);
  await assert.rejects(
    f.policy.change(companyId, async (manager) => {
      manager.reduce();
    }),
    ConflictException,
  );
  assert.equal(f.count(), 1);
  assert.equal(f.calls[0].lock.mode, "pessimistic_write");
  assert.equal(f.calls[0].where.id, companyId);
});
test("one of two active administrators may lose access", async () => {
  const f = fixture(2);
  const result = await f.policy.change(companyId, async (manager) => {
    manager.reduce();
    return "done";
  });
  assert.equal(result, "done");
  assert.equal(f.count(), 1);
});
test("concurrent removals serialize on the company lock; one administrator remains", async () => {
  const f = fixture(2);
  const results = await Promise.allSettled([
    f.policy.change(companyId, async (manager) => {
      manager.reduce();
    }),
    f.policy.change(companyId, async (manager) => {
      manager.reduce();
    }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.filter((r) => r.status === "rejected").length, 1);
  assert.equal(f.count(), 1);
});
test("companies with no provisioned administrator can still make non-reducing setup changes", async () => {
  const f = fixture(0);
  await f.policy.change(companyId, async () => {});
  assert.equal(f.count(), 0);
});
test("cross-company role unassignment is rejected before any mutation", async () => {
  const service = Object.create(IamService.prototype);
  service.audit = { write: async () => {} };
  service.findCompanyUser = async () => ({ company: { id: companyId } });
  service.findRole = async () => ({
    company: { id: "3fe23182-d73f-4cbe-aec2-b284cb284861" },
  });
  await assert.rejects(
    service.unassignRole("member", "role"),
    ForbiddenException,
  );
});
test("unassignment preserves member and role while deleting only the link", async () => {
  const service = Object.create(IamService.prototype);
  service.audit = { write: async () => {} };
  service.findCompanyUser = async () => ({ company: { id: companyId } });
  service.findRole = async () => ({ company: { id: companyId } });
  let removed;
  service.adminAccessPolicy = {
    change: async (id, fn) => {
      assert.equal(id, companyId);
      return fn({
        findOne: async () => ({ id: "assignment" }),
        remove: async (_entity, row) => {
          removed = row;
        },
      });
    },
  };
  await service.unassignRole("member", "role");
  assert.deepEqual(removed, { id: "assignment" });
});
test("revocation returns 404 for a nonexistent grant and does not delete permission definitions", async () => {
  const service = Object.create(IamService.prototype);
  service.audit = { write: async () => {} };
  service.findRole = async () => ({ company: { id: companyId } });
  service.adminAccessPolicy = {
    change: async (_id, fn) => fn({ findOne: async () => null }),
  };
  await assert.rejects(
    service.revokePermission("role", "permission"),
    NotFoundException,
  );
});
test("both deactivation entry points use shared administrator policy methods", async () => {
  const calls = [];
  const iam = {
    deactivateUser: async (id) => calls.push(["user", id]),
    deactivateCompanyUser: async (id) => calls.push(["member", id]),
  };
  const users = new UsersService({}, iam);
  const roles = new RolesService({}, {}, {}, {}, iam);
  await users.remove("u");
  await roles.removeCompanyUser("m");
  assert.deepEqual(calls, [
    ["user", "u"],
    ["member", "m"],
  ]);
});
test("new DELETE endpoints carry explicit resource ownership policies", async () => {
  assert.deepEqual(
    Reflect.getMetadata(IAM_SCOPE_KEY, RolesController.prototype.unassignRole),
    { kind: "membership", location: "params", key: "companyUserId" },
  );
  assert.deepEqual(
    Reflect.getMetadata(
      IAM_SCOPE_KEY,
      RolesController.prototype.revokePermission,
    ),
    { kind: "role", location: "params", key: "roleId" },
  );
});
test("new endpoints return 204, validate UUIDs, and require administrator access", async () => {
  const { Test } = await import("@nestjs/testing");
  const { APP_GUARD, Reflector } = await import("@nestjs/core");
  const { UnauthorizedException } = await import("@nestjs/common");
  const { default: request } = await import("supertest");
  const { IamAccessGuard } =
    await import("../dist/auth/guards/iam-access.guard.js");
  const memberId = "49bf54fc-89f9-465c-a914-496e39b9259c";
  const roleId = "b685740f-9912-46b3-95f9-7ba9935752b4";
  const permissionId = "1bdc53e8-6e90-4e57-ad1c-6278e508b57c";
  const calls = [];
  const guard = new IamAccessGuard(
    new Reflector(),
    {
      async canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        if (req.headers.authorization !== "Bearer admin")
          throw new UnauthorizedException();
        req.user = { id: "ba46e2cb-1803-4e21-a016-4f159108e4a1" };
        return true;
      },
    },
    {
      findRole: async () => ({ company: { id: companyId } }),
      findCompanyUser: async () => ({ company: { id: companyId } }),
      requireActiveCompanyMembership: async () => ({
        id: memberId,
        status: "active",
      }),
      permissionsForCompanyUser: async () => ["manage_iam"],
    },
    {},
  );
  const module = await Test.createTestingModule({
    controllers: [RolesController],
    providers: [
      {
        provide: RolesService,
        useValue: {
          unassignRole: async (...args) => calls.push(["unassign", ...args]),
          revokePermission: async (...args) => calls.push(["revoke", ...args]),
        },
      },
      { provide: APP_GUARD, useValue: guard },
    ],
  }).compile();
  const app = module.createNestApplication();
  await app.init();
  try {
    const api = request(app.getHttpServer());
    await api.delete(`/iam/user-roles/${memberId}/${roleId}`).expect(401);
    await api
      .delete(`/iam/user-roles/${memberId}/${roleId}`)
      .set("Authorization", "Bearer admin")
      .expect(204);
    await api
      .delete(`/iam/roles/${roleId}/permissions/${permissionId}`)
      .set("Authorization", "Bearer admin")
      .expect(204);
    await api
      .delete(`/iam/roles/${roleId}/permissions/invalid`)
      .set("Authorization", "Bearer admin")
      .expect(400);
    assert.deepEqual(calls, [
      ["unassign", memberId, roleId],
      ["revoke", roleId, permissionId],
    ]);
  } finally {
    await app.close();
  }
});
