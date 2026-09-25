import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../iam/entities/user.entity.js';
import { VerificationCase } from './verification-case.entity.js';
export declare class SupplierRiskAssessment extends BaseEntity {
    verificationCase: VerificationCase;
    riskLevel: string;
    riskScore?: number;
    rationale?: string;
    assessedBy: User;
    assessedAt: Date;
    expiresAt?: Date;
}
