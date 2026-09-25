export declare class CreateRoleDto {
    name: string;
    description?: string;
}
export declare class UpdateRoleDto {
    name?: string;
    description?: string;
}
export declare class CreatePermissionDto {
    name: string;
    description?: string;
}
export declare class AssignRoleDto {
    companyUserId: string;
    roleId: string;
}
export declare class GrantPermissionDto {
    roleId: string;
    permissionId: string;
}
export declare class AddCompanyUserDto {
    companyId: string;
    userId: string;
    departmentId?: string;
    employeeNumber?: string;
    jobTitle?: string;
}
export declare class UpdateCompanyUserDto {
    departmentId?: string;
    jobTitle?: string;
    status?: string;
}
