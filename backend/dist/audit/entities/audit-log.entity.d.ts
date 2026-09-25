import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';
import { User } from '../../iam/entities/user.entity.js';
export declare class AuditLog extends BaseEntity {
    company?: Company;
    user?: User;
    action: string;
    entityType: string;
    entityId?: string;
    oldValues?: object;
    newValues?: object;
    ipAddress?: string;
    userAgent?: string;
}
