import {
   Inject, 
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from './password-hasher.provider.js';


import { Company } from '../../organization/entities/company.entity.js';
import { Department } from '../../organization/entities/department.entity.js';

import { CompanyUser } from '../entities/company-user.entity.js';
import { Permission } from '../entities/permission.entity.js';
import { RolePermission } from '../entities/role-permission.entity.js';
import { Role } from '../entities/role.entity.js';
import { UserRole } from '../entities/user-role.entity.js';
import { User } from '../entities/user.entity.js';

import {
  AddCompanyUserDto,
  AssignRoleDto,
  CreatePermissionDto,
  CreateRoleDto,
  GrantPermissionDto,
  UpdateCompanyUserDto,
  UpdateRoleDto,
} from '../dto/role.dto.js';

import {
  CreateUserDto,
  UpdateUserDto,
} from '../dto/user.dto.js';

@Injectable()
export class IamService {
 
   constructor(
  @InjectRepository(User)
  private readonly users: Repository<User>,

  @InjectRepository(CompanyUser)
  private readonly companyUsers: Repository<CompanyUser>,

  @InjectRepository(Company)
  private readonly companies: Repository<Company>,

  @InjectRepository(Department)
  private readonly departments: Repository<Department>,

  @InjectRepository(Role)
  private readonly roles: Repository<Role>,

  @InjectRepository(Permission)
  private readonly permissions: Repository<Permission>,

  @InjectRepository(UserRole)
  private readonly userRoles: Repository<UserRole>,

  @InjectRepository(RolePermission)
  private readonly rolePermissions: Repository<RolePermission>,

  @Inject(PASSWORD_HASHER)
  private readonly passwordHasher: PasswordHasher,
) {}


  // -------------------------
  // Users
  // -------------------------

  async createUser(dto: CreateUserDto) {
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

  async findUser(id: string) {
    const user = await this.users.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.removePasswordHash(user);
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.users.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, dto);

    const updatedUser = await this.users.save(user);

    return this.removePasswordHash(updatedUser);
  }

  // -------------------------
  // Company memberships
  // -------------------------

  async addCompanyUser(dto: AddCompanyUserDto) {
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
        throw new NotFoundException(
          'Department was not found in this company',
        );
      }
    }

    const existingMembership = await this.companyUsers.findOne({
      where: {
        company: { id: dto.companyId },
        user: { id: dto.userId },
      },
    });

    if (existingMembership) {
      throw new ConflictException(
        'This user is already a member of the company',
      );
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

  async findCompanyUsers(companyId: string) {
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

  async findCompanyUser(id: string) {
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

  async updateCompanyUser(
    id: string,
    dto: UpdateCompanyUserDto,
  ) {
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
        throw new NotFoundException(
          'Department was not found in this company',
        );
      }
    }

    Object.assign(membership, dto);

    return this.companyUsers.save(membership);
  }

  // -------------------------
  // Roles
  // -------------------------

  async createRole(dto: CreateRoleDto) {
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

  async updateRole(id: string, dto: UpdateRoleDto) {
    const role = await this.roles.findOneBy({ id });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    Object.assign(role, dto);

    return this.roles.save(role);
  }

  // -------------------------
  // Permissions
  // -------------------------

  async createPermission(dto: CreatePermissionDto) {
    const existingPermission = await this.permissions.findOneBy({
      name: dto.name,
    });

    if (existingPermission) {
      throw new ConflictException('Permission name already exists');
    }

    return this.permissions.save(
      this.permissions.create(dto),
    );
  }

  async findPermissions() {
    return this.permissions.find({
      order: { name: 'ASC' },
    });
  }

  // -------------------------
  // Role assignments
  // -------------------------

  async assignRole(dto: AssignRoleDto) {
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
      throw new ConflictException(
        'This role is already assigned to the company user',
      );
    }

    return this.userRoles.save(
      this.userRoles.create({
        companyUser,
        role,
      }),
    );
  }

  // -------------------------
  // Permission grants
  // -------------------------

  async grantPermission(dto: GrantPermissionDto) {
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
      throw new ConflictException(
        'This permission is already granted to the role',
      );
    }

    return this.rolePermissions.save(
      this.rolePermissions.create({
        role,
        permission,
      }),
    );
  }

  async permissionsForCompanyUser(
    companyUserId: string,
  ): Promise<string[]> {
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

    const roleIds = assignments.map(
      (assignment) => assignment.role.id,
    );

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
      ...new Set(
        grants.map((grant) => grant.permission.name),
      ),
    ];
  }

  private removePasswordHash(user: User) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}