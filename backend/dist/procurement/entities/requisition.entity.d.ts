import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';
import { Department } from '../../organization/entities/department.entity.js';
import { CompanyUser } from '../../iam/entities/company-user.entity.js';
export declare class Requisition extends BaseEntity {
    company: Company;
    requisitionNumber: string;
    requester: CompanyUser;
    department?: Department;
    requestDate: Date;
    requiredDate?: Date;
    status: string;
    justification: string;
    approvalStatus: string;
    totalEstimatedAmount?: number;
}
