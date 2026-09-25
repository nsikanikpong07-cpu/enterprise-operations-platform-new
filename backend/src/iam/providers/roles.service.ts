import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AssignRoleDto,
  CreatePermissionDto,
  CreateRoleDto,
  GrantPermissionDto,
  UpdateRoleDto,
} from '../dto/role.dto.js';
import { Permission } from '../entities/permission.entity.js';
import { RolePermission } from '../entities/role-permission.entity.js';
import { Role } from '../entities/role.entity.js';
import { UserRole } from '../entities/user-role.entity.js';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
    @InjectRepository(UserRole)
    private readonly userRoles: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private readonly rolePermissions: Repository<RolePermission>,
  ) {}

  findAll(): Promise<Role[]> {
    return this.roles.find();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roles.findOneBy({ id });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  create(dto: CreateRoleDto): Promise<Role> {
    return this.roles.save(this.roles.create(dto));
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    Object.assign(role, dto);
    return this.roles.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    await this.roles.remove(role);
  }

  createPermission(dto: CreatePermissionDto): Promise<Permission> {
    return this.permissions.save(this.permissions.create(dto));
  }

  findPermissions(): Promise<Permission[]> {
    return this.permissions.find();
  }

  grantPermission(dto: GrantPermissionDto): Promise<RolePermission> {
    const { roleId, permissionId } = dto;
    return this.rolePermissions.save(
      this.rolePermissions.create({
        role: { id: roleId },
        permission: { id: permissionId },
      }),
    );
  }

  rolePermissionsFor(roleId: string): Promise<RolePermission[]> {
    return this.rolePermissions.find({
      where: { role: { id: roleId } },
      relations: { permission: true },
    });
  }

  assignRole(dto: AssignRoleDto): Promise<UserRole> {
    const { companyUserId, roleId } = dto;
    return this.userRoles.save(
      this.userRoles.create({
        companyUser: { id: companyUserId },
        role: { id: roleId },
      }),
    );
  }

  rolesForCompanyUser(companyUserId: string): Promise<UserRole[]> {
    return this.userRoles.find({
      where: { companyUser: { id: companyUserId } },
      relations: { role: true },
    });
  }
}
