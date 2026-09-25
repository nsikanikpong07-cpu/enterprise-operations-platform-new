import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';
import { Supplier } from './supplier.entity.js';
export declare class SupplierCompanyProfile extends BaseEntity {
    supplier: Supplier;
    company: Company;
    supplierCode?: string;
    relationshipStatus: string;
    onboardingStatus: string;
    notes?: string;
}
