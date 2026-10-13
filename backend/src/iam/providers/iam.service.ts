import { AuditWriterService } from "../../audit/providers/audit-writer.service.js";
import { AdminAccessPolicyService } from "./admin-access-policy.service.js";
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { CreateStaffDto } from "../dto/create-staff.dto.js";

import { Company } from "../../organization/entities/company.entity.js";
import { Department } from "../../organization/entities/department.entity.js";

import {
  AddCompanyUserDto,
  AssignRoleDto,
  CreatePermissionDto,
  CreateRoleDto,
  GrantPermissionDto,
  UpdateCompanyUserDto,
  UpdateRoleDto,
} from "../dto/role.dto.js";
import { CreateUserDto, UpdateUserDto } from "../dto/user.dto.js";

import { CompanyUser } from "../entities/company-user.entity.js";
import { Permission } from "../entities/permission.entity.js";
import { RolePermission } from "../entities/role-permission.entity.js";
import { Role } from "../entities/role.entity.js";
import { UserRole } from "../entities/user-role.entity.js";
import { User } from "../entities/user.entity.js";

import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from "./password-hasher.provider.js";

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

    private readonly dataSource: DataSource,
    private readonly adminAccessPolicy: AdminAccessPolicyService,
    private readonly audit: AuditWriterService,
  ) {}

  // Users

  async createUser(
    dto: CreateUserDto,
  ): Promise<Omit<User, "passwordHash" | "authVersion">> {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.users.findOneBy({ email });

    if (existingUser) {
      throw new ConflictException("A user with this email already exists");
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);

    const user = this.users.create({
      email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      status: "active",
    });

    try {
      const savedUser = await this.dataSource.transaction(async (manager) => {
        const saved = await manager.save(User, user);
        await this.audit.write(manager, {
          action: "user_created",
          entityType: "user",
          entityId: saved.id,
        });
        return saved;
      });

      // save() may return the hash despite select: false.
      return this.removePasswordHash(savedUser);
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException("A user with this email already exists");
      }

      throw error;
    }
  }

  async findUsers(): Promise<Omit<User, "passwordHash" | "authVersion">[]> {
    const users = await this.users.find({
      order: { createdAt: "DESC" },
    });

    return users.map((user) => this.removePasswordHash(user));
  }

  async findUser(
    id: string,
  ): Promise<Omit<User, "passwordHash" | "authVersion">> {
    const user = await this.users.findOneBy({ id });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.removePasswordHash(user);
  }

  async updateUser(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, "passwordHash" | "authVersion">> {
    const membership = await this.companyUsers.findOne({
      where: { user: { id } },
      relations: { company: true },
    });
    if (!membership) throw new NotFoundException("Staff membership not found");
    return this.adminAccessPolicy.change(
      membership.company.id,
      async (manager) => {
        const user = await manager.findOneBy(User, { id });
        if (!user) throw new NotFoundException("User not found");
        const oldStatus = user.status;
        const statusChanged = dto.status != null && dto.status !== user.status;
        Object.assign(
          user,
          Object.fromEntries(
            Object.entries(dto).filter(([, value]) => value !== undefined),
          ),
        );
        const saved = await manager.save(User, user);
        if (statusChanged)
          await manager.increment(User, { id }, "authVersion", 1);
        await this.audit.write(manager, {
          action: "staff_updated",
          entityType: "user",
          entityId: id,
          companyId: membership.company.id,
          oldValues: { status: oldStatus },
          newValues: {
            status: saved.status,
            changedFields: Object.entries(dto)
              .filter(([, value]) => value !== undefined)
              .map(([key]) => key),
          },
        });
        return this.removePasswordHash(saved);
      },
    );
  }

  // PRD US-2.1: create login and company membership atomically.
  async createStaff(dto: CreateStaffDto) {
    const email = dto.email.trim().toLowerCase();
    const passwordHash = await this.passwordHasher.hash(dto.password);
    try {
      return await this.dataSource.transaction(async (manager) => {
        const company = await manager.findOneBy(Company, { id: dto.companyId });
        if (!company) throw new NotFoundException("Company not found");
        if (company.status !== "active") {
          throw new ForbiddenException("Company must be active");
        }
        if (dto.departmentId) {
          const department = await manager.findOne(Department, {
            where: { id: dto.departmentId, company: { id: dto.companyId } },
          });
          if (!department)
            throw new NotFoundException(
              "Department was not found in this company",
            );
        }
        const user = await manager.save(
          User,
          manager.create(User, {
            email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            status: "active",
          }),
        );
        const membership = await manager.save(
          CompanyUser,
          manager.create(CompanyUser, {
            company: { id: company.id },
            user: { id: user.id },
            departmentId: dto.departmentId,
            employeeNumber: dto.employeeNumber,
            jobTitle: dto.jobTitle,
            status: "active",
          }),
        );
        await this.audit.write(manager, {
          action: "staff_created",
          entityType: "user",
          entityId: user.id,
          companyId: company.id,
          newValues: { companyUserId: membership.id },
        });
        return { user: this.removePasswordHash(user), membership };
      });
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException(
          "Email is already registered, or employee number is already used in this company",
        );
      }
      throw error;
    }
  }

  async findStaffUsers(
    companyId: string,
  ): Promise<Omit<User, "passwordHash" | "authVersion">[]> {
    const memberships = await this.findCompanyUsers(companyId);
    return memberships.map((membership) =>
      this.removePasswordHash(membership.user),
    );
  }

  // Company memberships

  async addCompanyUser(dto: AddCompanyUserDto): Promise<CompanyUser> {
    const company = await this.companies.findOneBy({
      id: dto.companyId,
    });

    if (!company) {
      throw new NotFoundException("Company not found");
    }

    const user = await this.users.findOneBy({
      id: dto.userId,
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (company.status !== "active" || user.status !== "active") {
      throw new ForbiddenException("The company and account must be active");
    }

    if (dto.departmentId) {
      const department = await this.departments.findOne({
        where: {
          id: dto.departmentId,
          company: { id: dto.companyId },
        },
      });

      if (!department) {
        throw new NotFoundException("Department was not found in this company");
      }
    }

    // Inactive memberships still count toward the one-company rule.
    const existingMembership = await this.companyUsers.findOne({
      where: {
        user: { id: dto.userId },
      },
    });

    if (existingMembership) {
      throw new ConflictException("This user already has a company membership");
    }

    const membership = this.companyUsers.create({
      company,
      user,
      departmentId: dto.departmentId,
      employeeNumber: dto.employeeNumber,
      jobTitle: dto.jobTitle,
      status: "active",
    });

    try {
      return await this.dataSource.transaction(async (manager) => {
        const saved = await manager.save(CompanyUser, membership);
        await this.audit.write(manager, {
          action: "membership_created",
          entityType: "company_user",
          entityId: saved.id,
          companyId: company.id,
          newValues: { userId: user.id },
        });
        return saved;
      });
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException(
          "The user already has a company membership, or the employee number is already used in this company",
        );
      }

      throw error;
    }
  }

  findCompanyUsers(companyId: string): Promise<CompanyUser[]> {
    return this.companyUsers.find({
      where: {
        company: { id: companyId },
      },
      relations: {
        company: true,
        user: true,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  async findCompanyUser(id: string): Promise<CompanyUser> {
    const membership = await this.companyUsers.findOne({
      where: { id },
      relations: {
        company: true,
        user: true,
      },
    });

    if (!membership) {
      throw new NotFoundException("Company membership not found");
    }

    return membership;
  }

  async updateCompanyUser(
    id: string,
    dto: UpdateCompanyUserDto,
  ): Promise<CompanyUser> {
    const existing = await this.findCompanyUser(id);
    return this.adminAccessPolicy.change(
      existing.company.id,
      async (manager) => {
        const membership = await manager.findOne(CompanyUser, {
          where: { id },
          relations: { company: true, user: true },
        });
        if (!membership)
          throw new NotFoundException("Company membership not found");
        if (dto.departmentId) {
          const department = await manager.findOne(Department, {
            where: {
              id: dto.departmentId,
              company: { id: membership.company.id },
            },
          });
          if (!department)
            throw new NotFoundException(
              "Department was not found in this company",
            );
        }
        const oldStatus = membership.status;
        const statusChanged =
          dto.status != null && dto.status !== membership.status;
        Object.assign(
          membership,
          Object.fromEntries(
            Object.entries(dto).filter(([, value]) => value !== undefined),
          ),
        );
        const saved = await manager.save(CompanyUser, membership);
        if (statusChanged)
          await manager.increment(
            User,
            { id: membership.user.id },
            "authVersion",
            1,
          );
        await this.audit.write(manager, {
          action: "membership_updated",
          entityType: "company_user",
          entityId: id,
          companyId: existing.company.id,
          oldValues: { status: oldStatus },
          newValues: {
            status: saved.status,
            changedFields: Object.entries(dto)
              .filter(([, value]) => value !== undefined)
              .map(([key]) => key),
          },
        });
        return saved;
      },
    );
  }

  // Company access

  async requireActiveCompanyMembership(
    userId: string,
    companyId: string,
  ): Promise<CompanyUser> {
    const membership = await this.companyUsers.findOne({
      where: {
        user: {
          id: userId,
          status: "active",
        },
        company: {
          id: companyId,
          status: "active",
        },
        status: "active",
      },
      relations: {
        company: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        "Your account, membership, and company must be active to access this workspace",
      );
    }

    return membership;
  }

  // Company-owned roles

  async createRole(dto: CreateRoleDto): Promise<Role> {
    const company = await this.companies.findOneBy({
      id: dto.companyId,
    });

    if (!company) {
      throw new NotFoundException("Company not found");
    }

    const name = dto.name.trim();

    // Other companies may have a role with the same name.
    const existingRole = await this.roles.findOne({
      where: {
        company: { id: dto.companyId },
        name,
      },
    });

    if (existingRole) {
      throw new ConflictException(
        "This company already has a role with this name",
      );
    }

    const role = this.roles.create({
      company,
      name,
      description: dto.description,
    });

    try {
      return await this.dataSource.transaction(async (manager) => {
        const saved = await manager.save(Role, role);
        await this.audit.write(manager, {
          action: "role_created",
          entityType: "role",
          entityId: saved.id,
          companyId: company.id,
          newValues: { name: saved.name },
        });
        return saved;
      });
    } catch (error: unknown) {
      // Also handle duplicate names created by simultaneous requests.
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException(
          "This company already has a role with this name",
        );
      }

      throw error;
    }
  }

  async findRoles(companyId: string): Promise<Role[]> {
    const company = await this.companies.findOneBy({
      id: companyId,
    });

    if (!company) {
      throw new NotFoundException("Company not found");
    }

    return this.roles.find({
      where: {
        company: { id: companyId },
      },
      relations: {
        company: true,
      },
      order: {
        name: "ASC",
      },
    });
  }

  async findRole(id: string): Promise<Role> {
    const role = await this.roles.findOne({
      where: { id },
      relations: {
        company: true,
      },
    });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    return role;
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findRole(id);
    const oldName = role.name;

    if (dto.name != null) {
      const name = dto.name.trim();

      const existingRole = await this.roles.findOne({
        where: {
          company: { id: role.company.id },
          name,
        },
      });

      if (existingRole && existingRole.id !== role.id) {
        throw new ConflictException(
          "This company already has a role with this name",
        );
      }

      role.name = name;
    }

    if (dto.description !== undefined) {
      role.description = dto.description;
    }

    // The role remains owned by its original company.
    try {
      return await this.dataSource.transaction(async (manager) => {
        const saved = await manager.save(Role, role);
        await this.audit.write(manager, {
          action: "role_updated",
          entityType: "role",
          entityId: id,
          companyId: role.company.id,
          oldValues: { name: oldName },
          newValues: {
            name: saved.name,
            changedFields: Object.entries(dto)
              .filter(([, value]) => value !== undefined)
              .map(([key]) => key),
          },
        });
        return saved;
      });
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException(
          "This company already has a role with this name",
        );
      }

      throw error;
    }
  }

  async removeRole(id: string): Promise<void> {
    const existing = await this.findRole(id);
    await this.adminAccessPolicy.change(
      existing.company.id,
      async (manager) => {
        const role = await manager.findOneBy(Role, { id });
        if (!role) throw new NotFoundException("Role not found");
        await manager.delete(UserRole, { role: { id } });
        await manager.delete(RolePermission, { role: { id } });
        await manager.remove(Role, role);
        await this.audit.write(manager, {
          action: "role_deleted",
          entityType: "role",
          entityId: id,
          companyId: existing.company.id,
          oldValues: { name: role.name },
        });
      },
    );
  }

  // Permissions are shared platform definitions.
  // Company roles receive grants from this common list.

  async createPermission(dto: CreatePermissionDto): Promise<Permission> {
    const existingPermission = await this.permissions.findOneBy({
      name: dto.name,
    });

    if (existingPermission) {
      throw new ConflictException("Permission name already exists");
    }

    try {
      return await this.permissions.save(this.permissions.create(dto));
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException("Permission name already exists");
      }

      throw error;
    }
  }

  findPermissions(): Promise<Permission[]> {
    return this.permissions.find({
      order: { name: "ASC" },
    });
  }

  // Role assignments

  async assignRole(dto: AssignRoleDto): Promise<UserRole> {
    const companyUser = await this.findCompanyUser(dto.companyUserId);
    const role = await this.findRole(dto.roleId);

    // A company's role cannot be assigned to another company's member.
    if (companyUser.company.id !== role.company.id) {
      throw new ForbiddenException(
        "The role and company membership must belong to the same company",
      );
    }

    if (
      companyUser.status !== "active" ||
      companyUser.user.status !== "active" ||
      companyUser.company.status !== "active"
    ) {
      throw new ForbiddenException(
        "The account, membership, and company must be active before assigning a role",
      );
    }

    const existingAssignment = await this.userRoles.findOne({
      where: {
        companyUser: { id: dto.companyUserId },
        role: { id: dto.roleId },
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        "This role is already assigned to the company user",
      );
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const saved = await manager.save(
          UserRole,
          manager.create(UserRole, { companyUser, role }),
        );
        await this.audit.write(manager, {
          action: "role_assigned",
          entityType: "user_role",
          entityId: saved.id,
          companyId: role.company.id,
          newValues: { companyUserId: dto.companyUserId, roleId: dto.roleId },
        });
        return saved;
      });
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException(
          "This role is already assigned to the company user",
        );
      }

      throw error;
    }
  }

  // Permission grants

  async grantPermission(dto: GrantPermissionDto): Promise<RolePermission> {
    const role = await this.findRole(dto.roleId);

    const permission = await this.permissions.findOneBy({
      id: dto.permissionId,
    });

    if (!permission) {
      throw new NotFoundException("Permission not found");
    }

    const existingGrant = await this.rolePermissions.findOne({
      where: {
        role: { id: dto.roleId },
        permission: { id: dto.permissionId },
      },
    });

    if (existingGrant) {
      throw new ConflictException(
        "This permission is already granted to the role",
      );
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const saved = await manager.save(
          RolePermission,
          manager.create(RolePermission, { role, permission }),
        );
        await this.audit.write(manager, {
          action: "permission_granted",
          entityType: "role_permission",
          entityId: saved.id,
          companyId: role.company.id,
          newValues: { roleId: dto.roleId, permissionId: dto.permissionId },
        });
        return saved;
      });
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException(
          "This permission is already granted to the role",
        );
      }

      throw error;
    }
  }

  async permissionsForCompanyUser(companyUserId: string): Promise<string[]> {
    const membership = await this.findCompanyUser(companyUserId);

    // Inactive accounts, memberships, or companies grant no access.
    if (
      membership.status !== "active" ||
      membership.user.status !== "active" ||
      membership.company.status !== "active"
    ) {
      return [];
    }

    const assignments = await this.userRoles.find({
      where: {
        companyUser: { id: companyUserId },

        // Ignore any invalid assignment from another company.
        role: {
          company: { id: membership.company.id },
        },
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
        role: {
          id: In(roleIds),
          company: { id: membership.company.id },
        },
      },
      relations: {
        permission: true,
      },
    });

    return [...new Set(grants.map((grant) => grant.permission.name))];
  }

  // DELETE endpoints use membership and role IDs, not link-row IDs.
  async unassignRole(companyUserId: string, roleId: string): Promise<void> {
    const membership = await this.findCompanyUser(companyUserId);
    const role = await this.findRole(roleId);
    if (membership.company.id !== role.company.id) {
      throw new ForbiddenException(
        "The role and company membership must belong to the same company",
      );
    }
    await this.adminAccessPolicy.change(
      membership.company.id,
      async (manager) => {
        const assignment = await manager.findOne(UserRole, {
          where: { companyUser: { id: companyUserId }, role: { id: roleId } },
        });
        if (!assignment)
          throw new NotFoundException("Role assignment not found");
        const assignmentId = assignment.id;
        await manager.remove(UserRole, assignment);
        await this.audit.write(manager, {
          action: "role_unassigned",
          entityType: "user_role",
          entityId: assignmentId,
          companyId: membership.company.id,
          oldValues: { companyUserId, roleId },
        });
      },
    );
  }

  async revokePermission(roleId: string, permissionId: string): Promise<void> {
    const role = await this.findRole(roleId);
    await this.adminAccessPolicy.change(role.company.id, async (manager) => {
      const grant = await manager.findOne(RolePermission, {
        where: { role: { id: roleId }, permission: { id: permissionId } },
      });
      if (!grant) throw new NotFoundException("Permission grant not found");
      const grantId = grant.id;
      await manager.remove(RolePermission, grant);
      await this.audit.write(manager, {
        action: "permission_revoked",
        entityType: "role_permission",
        entityId: grantId,
        companyId: role.company.id,
        oldValues: { roleId, permissionId },
      });
    });
  }

  async deactivateUser(id: string): Promise<void> {
    await this.updateUser(id, { status: "inactive" });
  }

  async deactivateCompanyUser(id: string): Promise<void> {
    await this.updateCompanyUser(id, { status: "inactive" });
  }

  // Internal helpers

  private removePasswordHash(
    user: User,
  ): Omit<User, "passwordHash" | "authVersion"> {
    const {
      passwordHash: _excluded,
      authVersion: _version,
      ...safeUser
    } = user;

    return safeUser;
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    if (typeof error !== "object" || error === null) {
      return false;
    }

    const databaseError = error as {
      code?: string;
      driverError?: {
        code?: string;
      };
    };

    return (
      databaseError.code === "23505" ||
      databaseError.driverError?.code === "23505"
    );
  }
}
