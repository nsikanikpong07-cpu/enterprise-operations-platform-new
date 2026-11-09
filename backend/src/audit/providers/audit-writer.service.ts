import { Injectable } from "@nestjs/common";
import { isIP } from "node:net";
import type { EntityManager } from "typeorm";
import { auditContext } from "./audit-context.js";

export interface AuditEvent {
  action: string;
  entityType: string;
  entityId?: string;
  companyId?: string;
  actorId?: string | null;
  oldValues?: object;
  newValues?: object;
}

@Injectable()
export class AuditWriterService {
  private safe(values?: object): object | null {
    if (!values) return null;
    // Deliberate allowlist: never serialize DTOs, user entities, hashes,
    // JWTs, reset tokens, SMTP credentials, or arbitrary nested objects.
    const allowed = new Set([
      "status",
      "name",
      "roleName",
      "roleId",
      "permissionId",
      "companyUserId",
      "userId",
      "changedFields",
      "sessionsRevoked",
    ]);
    return Object.fromEntries(
      Object.entries(values).filter(
        ([key, value]) =>
          allowed.has(key) &&
          (typeof value === "string" ||
            typeof value === "boolean" ||
            value === null ||
            (key === "changedFields" &&
              Array.isArray(value) &&
              value.every((x) => typeof x === "string"))),
      ),
    );
  }

  async write(
    manager: Pick<EntityManager, "query">,
    event: AuditEvent,
  ): Promise<void> {
    const context = auditContext.getStore();
    const actorId =
      event.actorId === null ? undefined : (event.actorId ?? context?.actorId);
    let companyId = event.companyId ?? context?.companyId;
    // Authentication endpoints do not run the company-access guard.
    // Resolve their staff workspace from the database when an owner is known.
    const ownerId =
      actorId ?? (event.entityType === "user" ? event.entityId : undefined);
    if (!companyId && ownerId) {
      const rows = await manager.query(
        "SELECT company_id FROM iam.company_users WHERE user_id=$1",
        [ownerId],
      );
      companyId = rows[0]?.company_id;
    }
    const ip = context?.ip && isIP(context.ip) ? context.ip : undefined;
    await manager.query(
      `
      INSERT INTO audit.audit_logs
        (company_id,user_id,action,entity_type,entity_id,old_values,new_values,ip_address,user_agent)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::inet,$9)
    `,
      [
        companyId ?? null,
        actorId ?? null,
        event.action,
        event.entityType,
        event.entityId ?? null,
        JSON.stringify(this.safe(event.oldValues)),
        JSON.stringify(this.safe(event.newValues)),
        ip ?? null,
        context?.userAgent ?? null,
      ],
    );
  }
}
