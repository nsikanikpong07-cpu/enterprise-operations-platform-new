import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';
import { User } from './user.entity.js';
export declare class CompanyUser extends BaseEntity {
    company: Company;
    user: User;
    departmentId?: string;
    employeeNumber?: string;
    jobTitle?: string;
    status: string;
}
