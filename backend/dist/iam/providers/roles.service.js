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
import { ConflictException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../organization/entities/company.entity.js';
import { Department } from '../../organization/entities/department.entity.js';
import { CompanyUser } from '../entities/company-user.entity.js';
import { Permission } from '../entities/permission.entity.js';
import { RolePermission } from '../entities/role-permission.entity.js';
import { Role } from '../entities/role.entity.js';
import { UserRole } from '../entities/user-role.entity.js';
import { User } from '../entities/user.entity.js';
let RolesService = class RolesService {
    roles;
    permissions;
    userRoles;
    rolePermissions;
    companyUsers;
    companies;
    users;
    departments;
    constructor(roles, permissions, userRoles, rolePermissions, companyUsers, companies, users, departments) {
        this.roles = roles;
        this.permissions = permissions;
        this.userRoles = userRoles;
        this.rolePermissions = rolePermissions;
        this.companyUsers = companyUsers;
        this.companies = companies;
        this.users = users;
        this.departments = departments;
    }
    findAll() {
        return this.roles.find();
    }
    async findOne(id) {
        const role = await this.roles.findOneBy({ id });
        if (!role) {
            throw new NotFoundException(`Role ${id} not found`);
        }
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
        const permission = this.permissions.create(dto);
        return this.permissions.save(permission);
    }
    findPermissions() {
        return this.permissions.find();
    }
    async grantPermission(dto) {
        const role = await this.roles.findOneBy({
            id: dto.roleId,
        });
        if (!role) {
            throw new NotFoundException('Role not found');
        }
        const permission = await this.permissions.findOneBy({
            id: dto.permissionId,
        });
        if (!permission) {
            throw new NotFoundException('Permission not found');
        }
        const existingGrant = await this.rolePermissions.findOne({
            where: {
                role: { id: dto.roleId },
                permission: { id: dto.permissionId },
            },
        });
        if (existingGrant) {
            throw new ConflictException('Permission has already been granted to this role');
        }
        const grant = this.rolePermissions.create({
            role,
            permission,
        });
        return this.rolePermissions.save(grant);
    }
    rolePermissionsFor(roleId) {
        return this.rolePermissions.find({
            where: {
                role: { id: roleId },
            },
            relations: {
                permission: true,
            },
        });
    }
    async assignRole(dto) {
        const companyUser = await this.companyUsers.findOneBy({
            id: dto.companyUserId,
        });
        if (!companyUser) {
            throw new NotFoundException('Company membership not found');
        }
        const role = await this.roles.findOneBy({
            id: dto.roleId,
        });
        if (!role) {
            throw new NotFoundException('Role not found');
        }
        const existingAssignment = await this.userRoles.findOne({
            where: {
                companyUser: { id: dto.companyUserId },
                role: { id: dto.roleId },
            },
        });
        if (existingAssignment) {
            throw new ConflictException('Role is already assigned to this company user');
        }
        const assignment = this.userRoles.create({
            companyUser,
            role,
        });
        return this.userRoles.save(assignment);
    }
    rolesForCompanyUser(companyUserId) {
        return this.userRoles.find({
            where: {
                companyUser: { id: companyUserId },
            },
            relations: {
                role: true,
            },
        });
    }
    async addCompanyUser(dto) {
        const company = await this.companies.findOneBy({
            id: dto.companyId,
        });
        if (!company) {
            throw new NotFoundException('Company not found');
        }
        const user = await this.users.findOneBy({
            id: dto.userId,
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (dto.departmentId) {
            const department = await this.departments.findOne({
                where: {
                    id: dto.departmentId,
                    company: {
                        id: dto.companyId,
                    },
                },
            });
            if (!department) {
                throw new NotFoundException('Department does not exist in this company');
            }
        }
        const existingMembership = await this.companyUsers.findOne({
            where: {
                company: {
                    id: dto.companyId,
                },
                user: {
                    id: dto.userId,
                },
            },
        });
        if (existingMembership) {
            throw new ConflictException('User is already a member of this company');
        }
        const membership = this.companyUsers.create({
            company,
            user,
            departmentId: dto.departmentId,
            employeeNumber: dto.employeeNumber,
            jobTitle: dto.jobTitle,
            status: 'active',
        });
        return this.companyUsers.save(membership);
    }
    findCompanyUsers(companyId) {
        return this.companyUsers.find({
            where: {
                company: {
                    id: companyId,
                },
            },
            relations: {
                company: true,
                user: true,
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }
    async findCompanyUser(id) {
        const membership = await this.companyUsers.findOne({
            where: { id },
            relations: {
                company: true,
                user: true,
            },
        });
        if (!membership) {
            throw new NotFoundException('Company membership not found');
        }
        return membership;
    }
    async updateCompanyUser(id, dto) {
        const membership = await this.companyUsers.findOne({
            where: { id },
            relations: {
                company: true,
            },
        });
        if (!membership) {
            throw new NotFoundException('Company membership not found');
        }
        if (dto.departmentId) {
            const department = await this.departments.findOne({
                where: {
                    id: dto.departmentId,
                    company: {
                        id: membership.company.id,
                    },
                },
            });
            if (!department) {
                throw new NotFoundException('Department does not exist in this company');
            }
        }
        Object.assign(membership, dto);
        return this.companyUsers.save(membership);
    }
    async removeCompanyUser(id) {
        const membership = await this.findCompanyUser(id);
        await this.companyUsers.remove(membership);
    }
};
RolesService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Role)),
    __param(1, InjectRepository(Permission)),
    __param(2, InjectRepository(UserRole)),
    __param(3, InjectRepository(RolePermission)),
    __param(4, InjectRepository(CompanyUser)),
    __param(5, InjectRepository(Company)),
    __param(6, InjectRepository(User)),
    __param(7, InjectRepository(Department)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository])
], RolesService);
export { RolesService };
//# sourceMappingURL=roles.service.js.map