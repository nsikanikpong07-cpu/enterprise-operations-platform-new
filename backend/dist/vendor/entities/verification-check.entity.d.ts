import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../iam/entities/user.entity.js';
import { VerificationCase } from './verification-case.entity.js';
export declare class VerificationCheck extends BaseEntity {
    verificationCase: VerificationCase;
    checkType: string;
    name: string;
    status: string;
    isRequired: boolean;
    checkedBy?: User;
    checkedAt?: Date;
    notes?: string;
}
