import { AddCompanyUserDto, UpdateCompanyUserDto } from '../dto/role.dto.js';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto.js';
import { UsersService } from '../providers/users.service.js';
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    findAll(): Promise<import("../entities/user.entity.js").User[]>;
    findOne(id: string): Promise<import("../entities/user.entity.js").User>;
    create(dto: CreateUserDto): Promise<import("../entities/user.entity.js").User>;
    update(id: string, dto: UpdateUserDto): Promise<import("../entities/user.entity.js").User>;
    remove(id: string): Promise<void>;
    findCompanyUsers(companyId: string): Promise<import("../entities/company-user.entity.js").CompanyUser[]>;
    addToCompany(dto: AddCompanyUserDto): Promise<import("../entities/company-user.entity.js").CompanyUser>;
    updateCompanyUser(id: string, dto: UpdateCompanyUserDto): Promise<import("../entities/company-user.entity.js").CompanyUser>;
}
