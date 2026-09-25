var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyUser } from '../entities/company-user.entity.js';
import { User } from '../entities/user.entity.js';
import { PASSWORD_HASHER } from './password-hasher.provider.js';
let UsersService = class UsersService {
    users;
    companyUsers;
    hasher;
    constructor(users, companyUsers, hasher) {
        this.users = users;
        this.companyUsers = companyUsers;
        this.hasher = hasher;
    }
    findAll() {
        return this.users.find();
    }
    async findOne(id) {
        const user = await this.users.findOneBy({ id });
        if (!user)
            throw new NotFoundException(`User ${id} not found`);
        return user;
    }
    create(dto) {
        const { password, ...rest } = dto;
        return this.users.save(this.users.create({ ...rest, passwordHash: this.hasher.hash(password) }));
    }
    async update(id, dto) {
        const user = await this.findOne(id);
        Object.assign(user, dto);
        return this.users.save(user);
    }
    async remove(id) {
        const user = await this.findOne(id);
        await this.users.remove(user);
    }
    addToCompany(dto) {
        const { companyId, userId, departmentId, ...rest } = dto;
        return this.companyUsers.save(this.companyUsers.create({
            ...rest,
            company: { id: companyId },
            user: { id: userId },
            departmentId,
        }));
    }
    findCompanyUsers(companyId) {
        return this.companyUsers.find({
            where: { company: { id: companyId } },
            relations: { user: true },
        });
    }
    async updateCompanyUser(id, dto) {
        const membership = await this.companyUsers.findOneBy({ id });
        if (!membership)
            throw new NotFoundException(`CompanyUser ${id} not found`);
        Object.assign(membership, dto);
        return this.companyUsers.save(membership);
    }
};
UsersService = __decorate([
    Injectable(),
    __param(0, InjectRepository(User)),
    __param(1, InjectRepository(CompanyUser)),
    __param(2, Inject(PASSWORD_HASHER)),
    __metadata("design:paramtypes", [Repository,
        Repository, Object])
], UsersService);
export { UsersService };
//# sourceMappingURL=users.service.js.map