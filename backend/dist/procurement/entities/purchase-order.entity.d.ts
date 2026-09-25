import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';
import { CompanyUser } from '../../iam/entities/company-user.entity.js';
import { SupplierCompanyProfile } from '../../vendor/entities/supplier-company-profile.entity.js';
import { Requisition } from './requisition.entity.js';
export declare class PurchaseOrder extends BaseEntity {
    company: Company;
    poNumber: string;
    requisition: Requisition;
    supplier: SupplierCompanyProfile;
    buyer: CompanyUser;
    orderDate: Date;
    expectedDeliveryDate?: Date;
    currency: string;
    totalAmount: number;
    status: string;
    paymentTerms?: string;
}
