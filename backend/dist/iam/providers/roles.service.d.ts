import { Repository } from 'typeorm';
import { AssignRoleDto, CreatePermissionDto, CreateRoleDto, GrantPermissionDto, UpdateRoleDto } from '../dto/role.dto.js';
import { Permission } from '../entities/permission.entity.js';
import { RolePermission } from '../entities/role-permission.entity.js';
import { Role } from '../entities/role.entity.js';
import { UserRole } from '../entities/user-role.entity.js';
export declare class RolesService {
    private readonly roles;
    private readonly permissions;
    private readonly userRoles;
    private readonly rolePermissions;
    constructor(roles: Repository<Role>, permissions: Repository<Permission>, userRoles: Repository<UserRole>, rolePermissions: Repository<RolePermission>);
    findAll(): Promise<Role[]>;
    findOne(id: string): Promise<Role>;
    create(dto: CreateRoleDto): Promise<Role>;
    update(id: string, dto: UpdateRoleDto): Promise<Role>;
    remove(id: string): Promise<void>;
    createPermission(dto: CreatePermissionDto): Promise<Permission>;
    findPermissions(): Promise<Permission[]>;
    grantPermission(dto: GrantPermissionDto): Promise<RolePermission>;
    rolePermissionsFor(roleId: string): Promise<RolePermission[]>;
    assignRole(dto: AssignRoleDto): Promise<UserRole>;
    rolesForCompanyUser(companyUserId: string): Promise<UserRole[]>;
}
