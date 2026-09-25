import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../iam/entities/user.entity.js';
import { SupplierDocument } from './supplier-document.entity.js';
import { VerificationCheck } from './verification-check.entity.js';
export declare class VerificationEvidence extends BaseEntity {
    check: VerificationCheck;
    supplierDocument?: SupplierDocument;
    evidenceType: string;
    fileUrl?: string;
    description?: string;
    uploadedBy: User;
}
