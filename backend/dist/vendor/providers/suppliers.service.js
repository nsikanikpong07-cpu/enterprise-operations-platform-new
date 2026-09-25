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
import { SupplierCompanyProfile } from '../entities/supplier-company-profile.entity.js';
import { SupplierContact } from '../entities/supplier-contact.entity.js';
import { SupplierDocument } from '../entities/supplier-document.entity.js';
import { Supplier } from '../entities/supplier.entity.js';
let SuppliersService = class SuppliersService {
    suppliers;
    profiles;
    contacts;
    documents;
    constructor(suppliers, profiles, contacts, documents) {
        this.suppliers = suppliers;
        this.profiles = profiles;
        this.contacts = contacts;
        this.documents = documents;
    }
    findAll() {
        return this.suppliers.find();
    }
    async findOne(id) {
        const supplier = await this.suppliers.findOneBy({ id });
        if (!supplier)
            throw new NotFoundException(`Supplier ${id} not found`);
        return supplier;
    }
    create(dto) {
        return this.suppliers.save(this.suppliers.create(dto));
    }
    async update(id, dto) {
        const supplier = await this.findOne(id);
        Object.assign(supplier, dto);
        return this.suppliers.save(supplier);
    }
    onboard(dto) {
        const { supplierId, companyId, ...rest } = dto;
        return this.profiles.save(this.profiles.create({
            ...rest,
            supplier: { id: supplierId },
            company: { id: companyId },
        }));
    }
    profilesForCompany(companyId) {
        return this.profiles.find({
            where: { company: { id: companyId } },
            relations: { supplier: true },
        });
    }
    async updateProfile(id, dto) {
        const profile = await this.profiles.findOneBy({ id });
        if (!profile)
            throw new NotFoundException(`SupplierCompanyProfile ${id} not found`);
        Object.assign(profile, dto);
        return this.profiles.save(profile);
    }
    addContact(dto) {
        const { supplierId, ...rest } = dto;
        return this.contacts.save(this.contacts.create({ ...rest, supplier: { id: supplierId } }));
    }
    contactsFor(supplierId) {
        return this.contacts.find({ where: { supplier: { id: supplierId } } });
    }
    addDocument(dto) {
        const { supplierId, companyProfileId, uploadedById, ...rest } = dto;
        return this.documents.save(this.documents.create({
            ...rest,
            supplier: { id: supplierId },
            companyProfile: companyProfileId
                ? { id: companyProfileId }
                : undefined,
            uploadedBy: uploadedById ? { id: uploadedById } : undefined,
        }));
    }
    documentsFor(supplierId) {
        return this.documents.find({ where: { supplier: { id: supplierId } } });
    }
};
SuppliersService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Supplier)),
    __param(1, InjectRepository(SupplierCompanyProfile)),
    __param(2, InjectRepository(SupplierContact)),
    __param(3, InjectRepository(SupplierDocument)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository])
], SuppliersService);
export { SuppliersService };
//# sourceMappingURL=suppliers.service.js.map