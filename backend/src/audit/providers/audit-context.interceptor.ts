import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import type { CompanyAuthenticatedRequest } from "../../auth/guards/company-access.guard.js";
import { auditContext } from "./audit-context.js";

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<CompanyAuthenticatedRequest>();
    const identity = {
      actorId: request.user?.id,
      companyId: request.companyMembership?.company.id,
      ip: request.ip ?? request.socket.remoteAddress,
      userAgent: request.headers["user-agent"]?.slice(0, 512),
    };
    return new Observable((subscriber) =>
      auditContext.run(identity, () => next.handle().subscribe(subscriber)),
    );
  }
}
