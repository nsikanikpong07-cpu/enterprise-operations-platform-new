var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, } from '@nestjs/common';
import { AssignRoleDto, CreatePermissionDto, CreateRoleDto, GrantPermissionDto, UpdateRoleDto, } from '../dto/role.dto.js';
import { RolesService } from '../providers/roles.service.js';
let RolesController = class RolesController {
    roles;
    constructor(roles) {
        this.roles = roles;
    }
    findAll() {
        return this.roles.findAll();
    }
    findOne(id) {
        return this.roles.findOne(id);
    }
    create(dto) {
        return this.roles.create(dto);
    }
    update(id, dto) {
        return this.roles.update(id, dto);
    }
    remove(id) {
        return this.roles.remove(id);
    }
    findPermissions() {
        return this.roles.findPermissions();
    }
    createPermission(dto) {
        return this.roles.createPermission(dto);
    }
    grantPermission(dto) {
        return this.roles.grantPermission(dto);
    }
    rolePermissions(id) {
        return this.roles.rolePermissionsFor(id);
    }
    assignRole(dto) {
        return this.roles.assignRole(dto);
    }
    rolesForCompanyUser(id) {
        return this.roles.rolesForCompanyUser(id);
    }
};
__decorate([
    Get('roles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findAll", null);
__decorate([
    Get('roles/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findOne", null);
__decorate([
    Post('roles'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateRoleDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "create", null);
__decorate([
    Patch('roles/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateRoleDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "update", null);
__decorate([
    Delete('roles/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "remove", null);
__decorate([
    Get('permissions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findPermissions", null);
__decorate([
    Post('permissions'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePermissionDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "createPermission", null);
__decorate([
    Post('roles/grant-permission'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GrantPermissionDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "grantPermission", null);
__decorate([
    Get('roles/:id/permissions'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "rolePermissions", null);
__decorate([
    Post('user-roles'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AssignRoleDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "assignRole", null);
__decorate([
    Get('user-roles/:companyUserId'),
    __param(0, Param('companyUserId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "rolesForCompanyUser", null);
RolesController = __decorate([
    Controller('iam'),
    __metadata("design:paramtypes", [RolesService])
], RolesController);
export { RolesController };
//# sourceMappingURL=roles.controller.js.map