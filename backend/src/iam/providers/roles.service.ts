import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  AddCompanyUserDto,
  AssignRoleDto,
  CreatePermissionDto,
  CreateRoleDto,
  GrantPermissionDto,
  UpdateCompanyUserDto,
  UpdateRoleDto,
} from '../dto/role.dto.js';

import { Company } from '../../organization/entities/company.entity.js';
import { Department } from '../../organization/entities/department.entity.js';

import { CompanyUser } from '../entities/company-user.entity.js';
import { Permission } from '../entities/permission.entity.js';
import { RolePermission } from '../entities/role-permission.entity.js';
import { Role } from '../entities/role.entity.js';
import { UserRole } from '../entities/user-role.entity.js';
import { User } from '../entities/user.entity.js';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,

    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,

    @InjectRepository(UserRole)
    private readonly userRoles: Repository<UserRole>,

    @InjectRepository(RolePermission)
    private readonly rolePermissions: Repository<RolePermission>,

    @InjectRepository(CompanyUser)
    private readonly companyUsers: Repository<CompanyUser>,

    @InjectRepository(Company)
    private readonly companies: Repository<Company>,

    @InjectRepository(User)
    private readonly users: Repository<User>,

    @InjectRepository(Department)
    private readonly departments: Repository<Department>,
  ) {}

  // Roles

  findAll(): Promise<Role[]> {
    return this.roles.find();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roles.findOneBy({ id });

    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }

    return role;
  }

  create(dto: CreateRoleDto): Promise<Role> {
    return this.roles.save(this.roles.create(dto));
  }

  async update(
    id: string,
    dto: UpdateRoleDto,
  ): Promise<Role> {
    const role = await this.findOne(id);

    Object.assign(role, dto);

    return this.roles.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);

    await this.roles.remove(role);
  }

  // Permissions

  createPermission(
    dto: CreatePermissionDto,
  ): Promise<Permission> {
    const permission = this.permissions.create(dto);

    return this.permissions.save(permission);
  }

  findPermissions(): Promise<Permission[]> {
    return this.permissions.find();
  }

  async grantPermission(
    dto: GrantPermissionDto,
  ): Promise<RolePermission> {
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

    const existingGrant =
      await this.rolePermissions.findOne({
        where: {
          role: { id: dto.roleId },
          permission: { id: dto.permissionId },
        },
      });

    if (existingGrant) {
      throw new ConflictException(
        'Permission has already been granted to this role',
      );
    }

    const grant = this.rolePermissions.create({
      role,
      permission,
    });

    return this.rolePermissions.save(grant);
  }

  rolePermissionsFor(
    roleId: string,
  ): Promise<RolePermission[]> {
    return this.rolePermissions.find({
      where: {
        role: { id: roleId },
      },
      relations: {
        permission: true,
      },
    });
  }

  // User roles

  async assignRole(
    dto: AssignRoleDto,
  ): Promise<UserRole> {
    const companyUser = await this.companyUsers.findOneBy({
      id: dto.companyUserId,
    });

    if (!companyUser) {
      throw new NotFoundException(
        'Company membership not found',
      );
    }

    const role = await this.roles.findOneBy({
      id: dto.roleId,
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const existingAssignment =
      await this.userRoles.findOne({
        where: {
          companyUser: { id: dto.companyUserId },
          role: { id: dto.roleId },
        },
      });

    if (existingAssignment) {
      throw new ConflictException(
        'Role is already assigned to this company user',
      );
    }

    const assignment = this.userRoles.create({
      companyUser,
      role,
    });

    return this.userRoles.save(assignment);
  }

  rolesForCompanyUser(
    companyUserId: string,
  ): Promise<UserRole[]> {
    return this.userRoles.find({
      where: {
        companyUser: { id: companyUserId },
      },
      relations: {
        role: true,
      },
    });
  }

  // Company users / memberships

  async addCompanyUser(
    dto: AddCompanyUserDto,
  ): Promise<CompanyUser> {
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
        throw new NotFoundException(
          'Department does not exist in this company',
        );
      }
    }

    const existingMembership =
      await this.companyUsers.findOne({
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
      throw new ConflictException(
        'User is already a member of this company',
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

  findCompanyUsers(
    companyId: string,
  ): Promise<CompanyUser[]> {
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

  async findCompanyUser(
    id: string,
  ): Promise<CompanyUser> {
    const membership = await this.companyUsers.findOne({
      where: { id },
      relations: {
        company: true,
        user: true,
      },
    });

    if (!membership) {
      throw new NotFoundException(
        'Company membership not found',
      );
    }

    return membership;
  }

  async updateCompanyUser(
    id: string,
    dto: UpdateCompanyUserDto,
  ): Promise<CompanyUser> {
    const membership = await this.companyUsers.findOne({
      where: { id },
      relations: {
        company: true,
      },
    });

    if (!membership) {
      throw new NotFoundException(
        'Company membership not found',
      );
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
        throw new NotFoundException(
          'Department does not exist in this company',
        );
      }
    }

    Object.assign(membership, dto);

    return this.companyUsers.save(membership);
  }

  async removeCompanyUser(id: string): Promise<void> {
    const membership = await this.findCompanyUser(id);

    await this.companyUsers.remove(membership);
  }
}