import { describe, expect, it, vi } from "vitest";
import { AuthController } from "../src/auth/controllers/auth.controller.js";
import { ProcurementReadGuard } from "../src/auth/guards/procurement-read.guard.js";
import { RequisitionsController } from "../src/procurement/controllers/requisitions.controller.js";
import { ProcurementController } from "../src/procurement/controllers/procurement.controller.js";

const companyId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
function context(controller: unknown, action: string, query: object = { companyId }) {
 const request = { method: "GET", query, params: {}, user: { id: userId } };
 return { request, value: { getClass: () => controller, getHandler: () => ({ name: action }), switchToHttp: () => ({ getRequest: () => request }) } };
}
describe("self permissions", () => {
 it("resolves only the signed-in user's active membership", async () => {
  const iam = { requireActiveCompanyMembership: vi.fn().mockResolvedValue({ id: "member" }), permissionsForCompanyUser: vi.fn().mockResolvedValue(["create_requisition"]) };
  const controller = new AuthController({} as never, {} as never, iam as never);
  expect(await controller.myPermissions(companyId, { user: { id: userId } } as never)).toEqual({ permissions: ["create_requisition"] });
  expect(iam.requireActiveCompanyMembership).toHaveBeenCalledWith(userId, companyId);
 });
 it("does not return permissions for a non-member", async () => {
  const iam = { requireActiveCompanyMembership: vi.fn().mockRejectedValue(new Error("not a member")), permissionsForCompanyUser: vi.fn() };
  const controller = new AuthController({} as never, {} as never, iam as never);
  await expect(controller.myPermissions(companyId, { user: { id: userId } } as never)).rejects.toThrow("not a member");
  expect(iam.permissionsForCompanyUser).not.toHaveBeenCalled();
 });
});
describe("procurement read policies", () => {
 function guard(permissions: string[]) { return new ProcurementReadGuard({ canActivate: async () => true } as never, { requireActiveCompanyMembership: async () => ({ id: "member" }), permissionsForCompanyUser: async () => permissions } as never, {} as never); }
 it("rejects a member without requisition access", async () => { const c = context(RequisitionsController, "findAll"); await expect(guard([]).canActivate(c.value as never)).rejects.toThrow("Requisition access is required"); });
 it("allows a requester to list requisitions", async () => { const c = context(RequisitionsController, "findAll"); expect(await guard(["create_requisition"]).canActivate(c.value as never)).toBe(true); });
 it("does not allow a requester to list purchase orders", async () => { const c = context(ProcurementController, "findOrders"); await expect(guard(["create_requisition"]).canActivate(c.value as never)).rejects.toThrow("Purchase order access is required"); });
 it("allows a receiver to list purchase orders", async () => { const c = context(ProcurementController, "findOrders"); expect(await guard(["receive_goods"]).canActivate(c.value as never)).toBe(true); });
});

describe("catalog read policies", () => {
 it("allows a requester to read catalog data for a requisition", async () => {
  const { CatalogAccessGuard } = await import("../src/auth/guards/catalog-access.guard.js");
  const { ItemsController } = await import("../src/catalog/controllers/items.controller.js");
  const guard = new CatalogAccessGuard({ canActivate: async () => true } as never, { requireActiveCompanyMembership: async () => ({ id: "member" }), permissionsForCompanyUser: async () => ["create_requisition"] } as never, { query: async () => [{ company_id: companyId }] } as never);
  const c = context(ItemsController, "findAll"); expect(await guard.canActivate(c.value as never)).toBe(true);
 });
 it("denies catalog data to a member without relevant permissions", async () => {
  const { CatalogAccessGuard } = await import("../src/auth/guards/catalog-access.guard.js");
  const { ItemsController } = await import("../src/catalog/controllers/items.controller.js");
  const guard = new CatalogAccessGuard({ canActivate: async () => true } as never, { requireActiveCompanyMembership: async () => ({ id: "member" }), permissionsForCompanyUser: async () => [] } as never, { query: async () => [{ company_id: companyId }] } as never);
  const c = context(ItemsController, "findAll"); await expect(guard.canActivate(c.value as never)).rejects.toThrow("Catalog access is required");
 });
});

describe("organization read policies", () => {
 async function check(permissions: string[]) {
  const { OrganizationAccessGuard } = await import("../src/auth/guards/organization-access.guard.js");
  const { OrganizationController } = await import("../src/organization/controllers/organization.controller.js");
  const request = { method: "GET", user: { id: userId }, query: {}, params: { companyId } };
  const c = { getClass: () => OrganizationController, getHandler: () => ({ name: "findDepartments" }), switchToHttp: () => ({ getRequest: () => request }) };
  const guard = new OrganizationAccessGuard({ canActivate: async () => true } as never, { requireActiveCompanyMembership: async () => ({ id: "member" }), permissionsForCompanyUser: async () => permissions } as never, {} as never);
  return guard.canActivate(c as never);
 }
 it("allows staff administrators to read departments for staff management", async () => { expect(await check(["manage_iam"])).toBe(true); });
 it("does not allow members without a relevant permission to read departments", async () => { await expect(check([])).rejects.toThrow("Organization access is required"); });
});
