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
import { Item } from '../entities/item.entity.js';
let ItemsService = class ItemsService {
    items;
    constructor(items) {
        this.items = items;
    }
    findAll(companyId) {
        return this.items.find({
            where: { company: { id: companyId } },
            relations: { category: true, unitOfMeasure: true },
        });
    }
    async findOne(id) {
        const item = await this.items.findOne({
            where: { id },
            relations: { category: true, unitOfMeasure: true },
        });
        if (!item)
            throw new NotFoundException(`Item ${id} not found`);
        return item;
    }
    create(dto) {
        const { companyId, categoryId, unitOfMeasureId, ...rest } = dto;
        return this.items.save(this.items.create({
            ...rest,
            company: { id: companyId },
            category: categoryId ? { id: categoryId } : undefined,
            unitOfMeasure: { id: unitOfMeasureId },
        }));
    }
    async update(id, dto) {
        const item = await this.findOne(id);
        const { categoryId, ...rest } = dto;
        Object.assign(item, rest);
        if (categoryId !== undefined)
            item.category = { id: categoryId };
        return this.items.save(item);
    }
    async remove(id) {
        const item = await this.findOne(id);
        await this.items.remove(item);
    }
};
ItemsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Item)),
    __metadata("design:paramtypes", [Repository])
], ItemsService);
export { ItemsService };
//# sourceMappingURL=items.service.js.map