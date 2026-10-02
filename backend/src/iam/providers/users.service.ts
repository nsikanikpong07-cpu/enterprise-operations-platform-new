import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyUser } from '../entities/company-user.entity.js';
import { User } from '../entities/user.entity.js';
import {
  AddCompanyUserDto,
  UpdateCompanyUserDto,
} from '../dto/role.dto.js';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto.js';
import { PASSWORD_HASHER } from './password-hasher.provider.js';
import type { PasswordHasher } from './password-hasher.provider.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(CompanyUser)
    private readonly companyUsers: Repository<CompanyUser>,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  findAll(): Promise<User[]> {
    return this.users.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  create(dto: CreateUserDto): Promise<User> {
    const { password, ...rest } = dto;
    return this.users.save(
      this.users.create({ ...rest, passwordHash: this.hasher.hash(password) }),
    );
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.users.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.users.remove(user);
  }

  addToCompany(dto: AddCompanyUserDto): Promise<CompanyUser> {
    const { companyId, userId, departmentId, ...rest } = dto;
    return this.companyUsers.save(
      this.companyUsers.create({
        ...rest,
        company: { id: companyId },
        user: { id: userId },
        departmentId,
      }),
    );
  }

  findCompanyUsers(companyId: string): Promise<CompanyUser[]> {
    return this.companyUsers.find({
      where: { company: { id: companyId } },
      relations: { user: true },
    });
  }

  async updateCompanyUser(
    id: string,
    dto: UpdateCompanyUserDto,
  ): Promise<CompanyUser> {
    const membership = await this.companyUsers.findOneBy({ id });
    if (!membership)
      throw new NotFoundException(`CompanyUser ${id} not found`);
    Object.assign(membership, dto);
    return this.companyUsers.save(membership);
  }
}
