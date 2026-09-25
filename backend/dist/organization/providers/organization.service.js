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
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entities/company.entity.js';
import { Department } from '../entities/department.entity.js';
import { Location } from '../entities/location.entity.js';
let OrganizationService = class OrganizationService {
    companies;
    departments;
    locations;
    constructor(companies, departments, locations) {
        this.companies = companies;
        this.departments = departments;
        this.locations = locations;
    }
    findCompanies() {
        return this.companies.find();
    }
    async findCompany(id) {
        const company = await this.companies.findOneBy({ id });
        if (!company)
            throw new NotFoundException(`Company ${id} not found`);
        return company;
    }
    createCompany(dto) {
        return this.companies.save(this.companies.create(dto));
    }
    async updateCompany(id, dto) {
        const company = await this.findCompany(id);
        Object.assign(company, dto);
        return this.companies.save(company);
    }
    async removeCompany(id) {
        const company = await this.findCompany(id);
        await this.companies.remove(company);
    }
    findDepartments(companyId) {
        return this.departments.find({ where: { company: { id: companyId } } });
    }
    async findDepartment(id) {
        const dept = await this.departments.findOneBy({ id });
        if (!dept)
            throw new NotFoundException(`Department ${id} not found`);
        return dept;
    }
    createDepartment(dto) {
        const { companyId, managerId, ...rest } = dto;
        return this.departments.save(this.departments.create({
            ...rest,
            company: { id: companyId },
            manager: managerId ? { id: managerId } : undefined,
        }));
    }
    async updateDepartment(id, dto) {
        const dept = await this.findDepartment(id);
        const { managerId, ...rest } = dto;
        Object.assign(dept, rest);
        if (managerId !== undefined)
            dept.manager = { id: managerId };
        return this.departments.save(dept);
    }
    async removeDepartment(id) {
        const dept = await this.findDepartment(id);
        await this.departments.remove(dept);
    }
    findLocations(companyId) {
        return this.locations.find({ where: { company: { id: companyId } } });
    }
    async findLocation(id) {
        const location = await this.locations.findOneBy({ id });
        if (!location)
            throw new NotFoundException(`Location ${id} not found`);
        return location;
    }
    createLocation(dto) {
        const { companyId, ...rest } = dto;
        return this.locations.save(this.locations.create({ ...rest, company: { id: companyId } }));
    }
    async updateLocation(id, dto) {
        const location = await this.findLocation(id);
        Object.assign(location, dto);
        return this.locations.save(location);
    }
    async removeLocation(id) {
        const location = await this.findLocation(id);
        await this.locations.remove(location);
    }
};
OrganizationService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Company)),
    __param(1, InjectRepository(Department)),
    __param(2, InjectRepository(Location)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository])
], OrganizationService);
export { OrganizationService };
//# sourceMappingURL=organization.service.js.map