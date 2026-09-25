import { Permission } from './permission.entity.js';
import { Role } from './role.entity.js';
export declare class RolePermission {
    id: string;
    role: Role;
    permission: Permission;
    createdAt: Date;
}
