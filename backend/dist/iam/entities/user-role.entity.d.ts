import { Role } from './role.entity.js';
import { CompanyUser } from './company-user.entity.js';
export declare class UserRole {
    id: string;
    companyUser: CompanyUser;
    role: Role;
    createdAt: Date;
}
