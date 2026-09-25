import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../iam/entities/user.entity.js';
import { VerificationCase } from './verification-case.entity.js';
export declare class VerificationReview extends BaseEntity {
    verificationCase: VerificationCase;
    reviewer: User;
    decision: string;
    comments?: string;
    reviewedAt: Date;
}
