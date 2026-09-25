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
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity.js';
import { RolePermission } from '../entities/role-permission.entity.js';
import { Role } from '../entities/role.entity.js';
import { UserRole } from '../entities/user-role.entity.js';
let RolesService = class RolesService {
    roles;
    permissions;
    userRoles;
    rolePermissions;
    constructor(roles, permissions, userRoles, rolePermissions) {
        this.roles = roles;
        this.permissions = permissions;
        this.userRoles = userRoles;
        this.rolePermissions = rolePermissions;
    }
    findAll() {
        return this.roles.find();
    }
    async findOne(id) {
        const role = await this.roles.findOneBy({ id });
        if (!role)
            throw new NotFoundException(`Role ${id} not found`);
        return role;
    }
    create(dto) {
        return this.roles.save(this.roles.create(dto));
    }
    async update(id, dto) {
        const role = await this.findOne(id);
        Object.assign(role, dto);
        return this.roles.save(role);
    }
    async remove(id) {
        const role = await this.findOne(id);
        await this.roles.remove(role);
    }
    createPermission(dto) {
        return this.permissions.save(this.permissions.create(dto));
    }
    findPermissions() {
        return this.permissions.find();
    }
    grantPermission(dto) {
        const { roleId, permissionId } = dto;
        return this.rolePermissions.save(this.rolePermissions.create({
            role: { id: roleId },
            permission: { id: permissionId },
        }));
    }
    rolePermissionsFor(roleId) {
        return this.rolePermissions.find({
            where: { role: { id: roleId } },
            relations: { permission: true },
        });
    }
    assignRole(dto) {
        const { companyUserId, roleId } = dto;
        return this.userRoles.save(this.userRoles.create({
            companyUser: { id: companyUserId },
            role: { id: roleId },
        }));
    }
    rolesForCompanyUser(companyUserId) {
        return this.userRoles.find({
            where: { companyUser: { id: companyUserId } },
            relations: { role: true },
        });
    }
};
RolesService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Role)),
    __param(1, InjectRepository(Permission)),
    __param(2, InjectRepository(UserRole)),
    __param(3, InjectRepository(RolePermission)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository])
], RolesService);
export { RolesService };
//# sourceMappingURL=roles.service.js.map