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
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RolePermission } from '../entities/role-permission.entity.js';
import { UserRole } from '../entities/user-role.entity.js';
let IamService = class IamService {
    userRoles;
    rolePermissions;
    constructor(userRoles, rolePermissions) {
        this.userRoles = userRoles;
        this.rolePermissions = rolePermissions;
    }
    async permissionsForCompanyUser(companyUserId) {
        const rows = await this.userRoles.find({
            where: { companyUser: { id: companyUserId } },
            relations: { role: true },
        });
        const roleIds = rows.map((row) => row.role.id);
        if (roleIds.length === 0)
            return [];
        const grants = await this.rolePermissions.find({
            where: { role: { id: In(roleIds) } },
            relations: { permission: true },
        });
        return [...new Set(grants.map((grant) => grant.permission.name))];
    }
};
IamService = __decorate([
    Injectable(),
    __param(0, InjectRepository(UserRole)),
    __param(1, InjectRepository(RolePermission)),
    __metadata("design:paramtypes", [Repository,
        Repository])
], IamService);
export { IamService };
//# sourceMappingURL=iam.service.js.map