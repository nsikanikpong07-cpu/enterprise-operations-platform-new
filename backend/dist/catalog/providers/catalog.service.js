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
import { ItemCategory } from '../entities/item-category.entity.js';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity.js';
let CatalogService = class CatalogService {
    categories;
    units;
    constructor(categories, units) {
        this.categories = categories;
        this.units = units;
    }
    findCategories(companyId) {
        return this.categories.find({
            where: { company: { id: companyId } },
            relations: { parent: true },
        });
    }
    async findCategory(id) {
        const category = await this.categories.findOne({
            where: { id },
            relations: { parent: true, children: true },
        });
        if (!category)
            throw new NotFoundException(`ItemCategory ${id} not found`);
        return category;
    }
    createCategory(dto) {
        const { companyId, parentId, ...rest } = dto;
        return this.categories.save(this.categories.create({
            ...rest,
            company: { id: companyId },
            parent: parentId ? { id: parentId } : undefined,
        }));
    }
    async updateCategory(id, dto) {
        const category = await this.findCategory(id);
        const { parentId, ...rest } = dto;
        Object.assign(category, rest);
        if (parentId !== undefined)
            category.parent = { id: parentId };
        return this.categories.save(category);
    }
    async removeCategory(id) {
        const category = await this.findCategory(id);
        await this.categories.remove(category);
    }
    findUnits() {
        return this.units.find();
    }
    createUnit(dto) {
        return this.units.save(this.units.create(dto));
    }
};
CatalogService = __decorate([
    Injectable(),
    __param(0, InjectRepository(ItemCategory)),
    __param(1, InjectRepository(UnitOfMeasure)),
    __metadata("design:paramtypes", [Repository,
        Repository])
], CatalogService);
export { CatalogService };
//# sourceMappingURL=catalog.service.js.map