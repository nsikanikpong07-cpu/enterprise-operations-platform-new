var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsIn, IsOptional, IsString, IsUUID, MaxLength, } from 'class-validator';
export class CreateRoleDto {
    name;
    description;
}
__decorate([
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "description", void 0);
export class UpdateRoleDto {
    name;
    description;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateRoleDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateRoleDto.prototype, "description", void 0);
export class CreatePermissionDto {
    name;
    description;
}
__decorate([
    IsString(),
    MaxLength(150),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "description", void 0);
export class AssignRoleDto {
    companyUserId;
    roleId;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], AssignRoleDto.prototype, "companyUserId", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], AssignRoleDto.prototype, "roleId", void 0);
export class GrantPermissionDto {
    roleId;
    permissionId;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], GrantPermissionDto.prototype, "roleId", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], GrantPermissionDto.prototype, "permissionId", void 0);
export class AddCompanyUserDto {
    companyId;
    userId;
    departmentId;
    employeeNumber;
    jobTitle;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], AddCompanyUserDto.prototype, "companyId", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], AddCompanyUserDto.prototype, "userId", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], AddCompanyUserDto.prototype, "departmentId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], AddCompanyUserDto.prototype, "employeeNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(150),
    __metadata("design:type", String)
], AddCompanyUserDto.prototype, "jobTitle", void 0);
export class UpdateCompanyUserDto {
    departmentId;
    jobTitle;
    status;
}
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], UpdateCompanyUserDto.prototype, "departmentId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(150),
    __metadata("design:type", String)
], UpdateCompanyUserDto.prototype, "jobTitle", void 0);
__decorate([
    IsOptional(),
    IsIn(['active', 'suspended', 'inactive']),
    __metadata("design:type", String)
], UpdateCompanyUserDto.prototype, "status", void 0);
//# sourceMappingURL=role.dto.js.map