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
import { Inject, ConflictException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PASSWORD_HASHER, } from './password-hasher.provider.js';
import { Company } from '../../organization/entities/company.entity.js';
import { Department } from '../../organization/entities/department.entity.js';
import { CompanyUser } from '../entities/company-user.entity.js';
import { Permission } from '../entities/permission.entity.js';
import { RolePermission } from '../entities/role-permission.entity.js';
import { Role } from '../entities/role.entity.js';
import { UserRole } from '../entities/user-role.entity.js';
import { User } from '../entities/user.entity.js';
let IamService = class IamService {
    users;
    companyUsers;
    companies;
    departments;
    roles;
    permissions;
    userRoles;
    rolePermissions;
    passwordHasher;
    constructor(users, companyUsers, companies, departments, roles, permissions, userRoles, rolePermissions, passwordHasher) {
        this.users = users;
        this.companyUsers = companyUsers;
        this.companies = companies;
        this.departments = departments;
        this.roles = roles;
        this.permissions = permissions;
        this.userRoles = userRoles;
        this.rolePermissions = rolePermissions;
        this.passwordHasher = passwordHasher;
    }
    async createUser(dto) {
        const existingUser = await this.users.findOneBy({
            email: dto.email.toLowerCase(),
        });
        if (existingUser) {
            throw new ConflictException('A user with this email already exists');
        }
        const passwordHash = this.passwordHasher.hash(dto.password);
        const user = this.users.create({
            email: dto.email.toLowerCase(),
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            status: 'active',
        });
        const savedUser = await this.users.save(user);
        return this.removePasswordHash(savedUser);
    }
    async findUsers() {
        const users = await this.users.find({
            order: { createdAt: 'DESC' },
        });
        return users.map((user) => this.removePasswordHash(user));
    }
    async findUser(id) {
        const user = await this.users.findOneBy({ id });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return this.removePasswordHash(user);
    }
    async updateUser(id, dto) {
        const user = await this.users.findOneBy({ id });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        Object.assign(user, dto);
        const updatedUser = await this.users.save(user);
        return this.removePasswordHash(updatedUser);
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
                    company: { id: dto.companyId },
                },
            });
            if (!department) {
                throw new NotFoundException('Department was not found in this company');
            }
        }
        const existingMembership = await this.companyUsers.findOne({
            where: {
                company: { id: dto.companyId },
                user: { id: dto.userId },
            },
        });
        if (existingMembership) {
            throw new ConflictException('This user is already a member of the company');
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
    async findCompanyUsers(companyId) {
        return this.companyUsers.find({
            where: {
                company: { id: companyId },
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
                    company: { id: membership.company.id },
                },
            });
            if (!department) {
                throw new NotFoundException('Department was not found in this company');
            }
        }
        Object.assign(membership, dto);
        return this.companyUsers.save(membership);
    }
    async createRole(dto) {
        const existingRole = await this.roles.findOneBy({
            name: dto.name,
        });
        if (existingRole) {
            throw new ConflictException('Role name already exists');
        }
        return this.roles.save(this.roles.create(dto));
    }
    async findRoles() {
        return this.roles.find({
            order: { name: 'ASC' },
        });
    }
    async updateRole(id, dto) {
        const role = await this.roles.findOneBy({ id });
        if (!role) {
            throw new NotFoundException('Role not found');
        }
        Object.assign(role, dto);
        return this.roles.save(role);
    }
    async createPermission(dto) {
        const existingPermission = await this.permissions.findOneBy({
            name: dto.name,
        });
        if (existingPermission) {
            throw new ConflictException('Permission name already exists');
        }
        return this.permissions.save(this.permissions.create(dto));
    }
    async findPermissions() {
        return this.permissions.find({
            order: { name: 'ASC' },
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
            throw new ConflictException('This role is already assigned to the company user');
        }
        return this.userRoles.save(this.userRoles.create({
            companyUser,
            role,
        }));
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
            throw new ConflictException('This permission is already granted to the role');
        }
        return this.rolePermissions.save(this.rolePermissions.create({
            role,
            permission,
        }));
    }
    async permissionsForCompanyUser(companyUserId) {
        const membership = await this.companyUsers.findOneBy({
            id: companyUserId,
        });
        if (!membership) {
            throw new NotFoundException('Company membership not found');
        }
        const assignments = await this.userRoles.find({
            where: {
                companyUser: { id: companyUserId },
            },
            relations: {
                role: true,
            },
        });
        const roleIds = assignments.map((assignment) => assignment.role.id);
        if (roleIds.length === 0) {
            return [];
        }
        const grants = await this.rolePermissions.find({
            where: {
                role: { id: In(roleIds) },
            },
            relations: {
                permission: true,
            },
        });
        return [
            ...new Set(grants.map((grant) => grant.permission.name)),
        ];
    }
    removePasswordHash(user) {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
    }
};
IamService = __decorate([
    Injectable(),
    __param(0, InjectRepository(User)),
    __param(1, InjectRepository(CompanyUser)),
    __param(2, InjectRepository(Company)),
    __param(3, InjectRepository(Department)),
    __param(4, InjectRepository(Role)),
    __param(5, InjectRepository(Permission)),
    __param(6, InjectRepository(UserRole)),
    __param(7, InjectRepository(RolePermission)),
    __param(8, Inject(PASSWORD_HASHER)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository, Object])
], IamService);
export { IamService };
//# sourceMappingURL=iam.service.js.map