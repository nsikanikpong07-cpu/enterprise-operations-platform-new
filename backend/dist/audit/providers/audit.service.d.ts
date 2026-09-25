import { Repository } from 'typeorm';
import { AuditLogQueryDto, CreateAuditLogDto } from '../dto/audit.dto.js';
import { AuditLog } from '../entities/audit-log.entity.js';
export declare class AuditService {
    private readonly auditLogs;
    constructor(auditLogs: Repository<AuditLog>);
    findAll(query: AuditLogQueryDto): Promise<AuditLog[]>;
    record(dto: CreateAuditLogDto): Promise<AuditLog>;
}
