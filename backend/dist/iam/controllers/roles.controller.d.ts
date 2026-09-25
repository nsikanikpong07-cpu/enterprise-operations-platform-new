import { AssignRoleDto, CreatePermissionDto, CreateRoleDto, GrantPermissionDto, UpdateRoleDto } from '../dto/role.dto.js';
import { RolesService } from '../providers/roles.service.js';
export declare class RolesController {
    private readonly roles;
    constructor(roles: RolesService);
    findAll(): Promise<import("../entities/role.entity.js").Role[]>;
    findOne(id: string): Promise<import("../entities/role.entity.js").Role>;
    create(dto: CreateRoleDto): Promise<import("../entities/role.entity.js").Role>;
    update(id: string, dto: UpdateRoleDto): Promise<import("../entities/role.entity.js").Role>;
    remove(id: string): Promise<void>;
    findPermissions(): Promise<import("../entities/permission.entity.js").Permission[]>;
    createPermission(dto: CreatePermissionDto): Promise<import("../entities/permission.entity.js").Permission>;
    grantPermission(dto: GrantPermissionDto): Promise<import("../entities/role-permission.entity.js").RolePermission>;
    rolePermissions(id: string): Promise<import("../entities/role-permission.entity.js").RolePermission[]>;
    assignRole(dto: AssignRoleDto): Promise<import("../entities/user-role.entity.js").UserRole>;
    rolesForCompanyUser(id: string): Promise<import("../entities/user-role.entity.js").UserRole[]>;
}
