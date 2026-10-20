import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  AddCompanyUserDto,
  AssignRoleDto,
  CreatePermissionDto,
  CreateRoleDto,
  GrantPermissionDto,
  UpdateCompanyUserDto,
  UpdateRoleDto,
} from "../dto/role.dto.js";

import { CompanyUser } from "../entities/company-user.entity.js";
import { Permission } from "../entities/permission.entity.js";
import { RolePermission } from "../entities/role-permission.entity.js";
import { Role } from "../entities/role.entity.js";
import { UserRole } from "../entities/user-role.entity.js";
import { IamService } from "./iam.service.js";

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,

    @InjectRepository(UserRole)
    private readonly userRoles: Repository<UserRole>,

    @InjectRepository(RolePermission)
    private readonly rolePermissions: Repository<RolePermission>,

    @InjectRepository(CompanyUser)
    private readonly companyUsers: Repository<CompanyUser>,

    private readonly iam: IamService,
  ) {}

  // Company-owned roles

  findAll(companyId: string): Promise<Role[]> {
    return this.iam.findRoles(companyId);
  }

  findOne(id: string): Promise<Role> {
    return this.iam.findRole(id);
  }

  create(dto: CreateRoleDto): Promise<Role> {
    return this.iam.createRole(dto);
  }

  update(id: string, dto: UpdateRoleDto): Promise<Role> {
    return this.iam.updateRole(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.iam.removeRole(id);
  }

  // Platform permissions and grants

  createPermission(dto: CreatePermissionDto): Promise<Permission> {
    return this.iam.createPermission(dto);
  }

  findPermissions(): Promise<Permission[]> {
    return this.iam.findPermissions();
  }

  grantPermission(dto: GrantPermissionDto): Promise<RolePermission> {
    return this.iam.grantPermission(dto);
  }

  async rolePermissionsFor(roleId: string): Promise<RolePermission[]> {
    await this.findOne(roleId);

    return this.rolePermissions.find({
      where: {
        role: { id: roleId },
      },
      relations: {
        permission: true,
      },
    });
  }

  // Company membership role assignments

  assignRole(dto: AssignRoleDto): Promise<UserRole> {
    return this.iam.assignRole(dto);
  }

  async rolesForCompanyUser(companyUserId: string): Promise<UserRole[]> {
    const membership = await this.iam.findCompanyUser(companyUserId);

    return this.userRoles.find({
      where: {
        companyUser: { id: companyUserId },
        role: {
          company: { id: membership.company.id },
        },
      },
      relations: {
        role: {
          company: true,
        },
      },
    });
  }

  // Membership endpoints share validation with UsersService.

  addCompanyUser(dto: AddCompanyUserDto): Promise<CompanyUser> {
    return this.iam.addCompanyUser(dto);
  }

  findCompanyUsers(companyId: string): Promise<CompanyUser[]> {
    return this.iam.findCompanyUsers(companyId);
  }

  findCompanyUser(id: string): Promise<CompanyUser> {
    return this.iam.findCompanyUser(id);
  }

  updateCompanyUser(
    id: string,
    dto: UpdateCompanyUserDto,
  ): Promise<CompanyUser> {
    return this.iam.updateCompanyUser(id, dto);
  }

  async removeCompanyUser(id: string): Promise<void> {
    await this.iam.deactivateCompanyUser(id);
  }

  unassignRole(companyUserId: string, roleId: string): Promise<void> {
    return this.iam.unassignRole(companyUserId, roleId);
  }

  revokePermission(roleId: string, permissionId: string): Promise<void> {
    return this.iam.revokePermission(roleId, permissionId);
  }
}
