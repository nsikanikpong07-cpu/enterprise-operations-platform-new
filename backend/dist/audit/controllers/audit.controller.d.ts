import { AuditLogQueryDto } from '../dto/audit.dto.js';
import { AuditService } from '../providers/audit.service.js';
export declare class AuditController {
    private readonly audit;
    constructor(audit: AuditService);
    findAll(query: AuditLogQueryDto): Promise<import("../entities/audit-log.entity.js").AuditLog[]>;
}
