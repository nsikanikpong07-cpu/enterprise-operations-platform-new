export declare class AuditLogQueryDto {
    companyId?: string;
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
}
export declare class CreateAuditLogDto {
    companyId?: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldValues?: object;
    newValues?: object;
    ipAddress?: string;
    userAgent?: string;
}
