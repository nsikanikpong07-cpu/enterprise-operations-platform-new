import { Repository } from 'typeorm';
import { CompanyUser } from '../entities/company-user.entity.js';
import { User } from '../entities/user.entity.js';
import { AddCompanyUserDto, UpdateCompanyUserDto } from '../dto/role.dto.js';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto.js';
import type { PasswordHasher } from './password-hasher.provider.js';
export declare class UsersService {
    private readonly users;
    private readonly companyUsers;
    private readonly hasher;
    constructor(users: Repository<User>, companyUsers: Repository<CompanyUser>, hasher: PasswordHasher);
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    create(dto: CreateUserDto): Promise<User>;
    update(id: string, dto: UpdateUserDto): Promise<User>;
    remove(id: string): Promise<void>;
    addToCompany(dto: AddCompanyUserDto): Promise<CompanyUser>;
    findCompanyUsers(companyId: string): Promise<CompanyUser[]>;
    updateCompanyUser(id: string, dto: UpdateCompanyUserDto): Promise<CompanyUser>;
}
