import { CreateStaffDto } from "../dto/create-staff.dto.js";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AddCompanyUserDto, UpdateCompanyUserDto } from "../dto/role.dto.js";
import { UpdateUserDto } from "../dto/user.dto.js";

import { CompanyUser } from "../entities/company-user.entity.js";
import { User } from "../entities/user.entity.js";
import { IamService } from "./iam.service.js";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,

    private readonly iam: IamService,
  ) {}

  // Delegate user operations to the shared IAM implementation.
  // Password hashing and response sanitization live in one place.

  findAll(
    companyId: string,
  ): Promise<Omit<User, "passwordHash" | "authVersion">[]> {
    return this.iam.findStaffUsers(companyId);
  }

  findOne(id: string): Promise<Omit<User, "passwordHash" | "authVersion">> {
    return this.iam.findUser(id);
  }

  create(dto: CreateStaffDto) {
    return this.iam.createStaff(dto);
  }

  update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, "passwordHash" | "authVersion">> {
    return this.iam.updateUser(id, dto);
  }

  async remove(id: string): Promise<void> {
    // Deactivation preserves history and checks the last-admin rule.
    await this.iam.deactivateUser(id);
  }

  // Membership endpoints now use the same validation as IamService.

  addToCompany(dto: AddCompanyUserDto): Promise<CompanyUser> {
    return this.iam.addCompanyUser(dto);
  }

  findCompanyUsers(companyId: string): Promise<CompanyUser[]> {
    return this.iam.findCompanyUsers(companyId);
  }

  updateCompanyUser(
    id: string,
    dto: UpdateCompanyUserDto,
  ): Promise<CompanyUser> {
    return this.iam.updateCompanyUser(id, dto);
  }
}
