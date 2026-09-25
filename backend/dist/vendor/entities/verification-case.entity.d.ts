import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../iam/entities/user.entity.js';
import { SupplierCompanyProfile } from './supplier-company-profile.entity.js';
export declare class VerificationCase extends BaseEntity {
    companyProfile: SupplierCompanyProfile;
    caseNumber: string;
    verificationType: string;
    status: string;
    openedBy: User;
    openedAt: Date;
    completedAt?: Date;
    expiresAt?: Date;
}
