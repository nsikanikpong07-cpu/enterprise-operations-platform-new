import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../iam/entities/user.entity.js';
import { SupplierCompanyProfile } from './supplier-company-profile.entity.js';
import { Supplier } from './supplier.entity.js';
export declare class SupplierDocument extends BaseEntity {
    supplier: Supplier;
    companyProfile?: SupplierCompanyProfile;
    documentType: string;
    documentNumber?: string;
    fileUrl: string;
    fileHash?: string;
    issuedAt?: Date;
    expiresAt?: Date;
    status: string;
    uploadedBy?: User;
}
