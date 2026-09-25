import { Repository } from 'typeorm';
import { RolePermission } from '../entities/role-permission.entity.js';
import { UserRole } from '../entities/user-role.entity.js';
export declare class IamService {
    private readonly userRoles;
    private readonly rolePermissions;
    constructor(userRoles: Repository<UserRole>, rolePermissions: Repository<RolePermission>);
    permissionsForCompanyUser(companyUserId: string): Promise<string[]>;
}
