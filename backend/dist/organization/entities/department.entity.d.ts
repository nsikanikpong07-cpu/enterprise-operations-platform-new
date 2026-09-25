import { BaseEntity } from '../../common/entities/base.entity.js';
import { CompanyUser } from '../../iam/entities/company-user.entity.js';
import { Company } from './company.entity.js';
export declare class Department extends BaseEntity {
    company: Company;
    name: string;
    code?: string;
    manager?: CompanyUser;
}
