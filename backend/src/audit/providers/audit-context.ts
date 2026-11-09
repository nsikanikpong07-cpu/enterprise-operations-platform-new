import { AsyncLocalStorage } from "node:async_hooks";

export interface AuditContext {
  actorId?: string;
  companyId?: string;
  ip?: string;
  userAgent?: string;
}
// AsyncLocalStorage isolates concurrent request identities without passing
// request objects through every business method or logging request bodies.
export const auditContext = new AsyncLocalStorage<AuditContext>();
