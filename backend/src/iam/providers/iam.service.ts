import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RolePermission } from '../entities/role-permission.entity.js';
import { UserRole } from '../entities/user-role.entity.js';

@Injectable()
export class IamService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoles: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private readonly rolePermissions: Repository<RolePermission>,
  ) {}

  async permissionsForCompanyUser(companyUserId: string): Promise<string[]> {
    const rows = await this.userRoles.find({
      where: { companyUser: { id: companyUserId } },
      relations: { role: true },
    });
    const roleIds = rows.map((row) => row.role.id);
    if (roleIds.length === 0) return [];

    const grants = await this.rolePermissions.find({
      where: { role: { id: In(roleIds) } },
      relations: { permission: true },
    });
    return [...new Set(grants.map((grant) => grant.permission.name))];
  }
}
