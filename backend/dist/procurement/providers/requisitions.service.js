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
import { DataSource, Repository } from 'typeorm';
import { RequisitionItem } from '../entities/requisition-item.entity.js';
import { Requisition } from '../entities/requisition.entity.js';
let RequisitionsService = class RequisitionsService {
    requisitions;
    dataSource;
    constructor(requisitions, dataSource) {
        this.requisitions = requisitions;
        this.dataSource = dataSource;
    }
    findAll(companyId) {
        return this.requisitions.find({
            where: { company: { id: companyId } },
            relations: { requester: true, department: true },
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const requisition = await this.requisitions.findOne({
            where: { id },
            relations: { requester: true, department: true },
        });
        if (!requisition)
            throw new NotFoundException(`Requisition ${id} not found`);
        return requisition;
    }
    itemsFor(id) {
        return this.dataSource.getRepository(RequisitionItem).find({
            where: { requisition: { id } },
            relations: { item: true, unitOfMeasure: true },
        });
    }
    create(dto) {
        const { companyId, requesterId, departmentId, items, ...rest } = dto;
        return this.dataSource.transaction(async (manager) => {
            const requisition = await manager.save(manager.create(Requisition, {
                ...rest,
                company: { id: companyId },
                requester: { id: requesterId },
                department: departmentId ? { id: departmentId } : undefined,
            }));
            await manager.save(items.map((item) => manager.create(RequisitionItem, {
                ...item,
                requisition: { id: requisition.id },
                item: { id: item.itemId },
                unitOfMeasure: { id: item.unitOfMeasureId },
                estimatedTotalPrice: item.estimatedUnitPrice != null
                    ? item.estimatedUnitPrice * item.quantityRequested
                    : undefined,
            })));
            return requisition;
        });
    }
    async update(id, dto) {
        const requisition = await this.findOne(id);
        Object.assign(requisition, dto);
        return this.requisitions.save(requisition);
    }
};
RequisitionsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Requisition)),
    __metadata("design:paramtypes", [Repository,
        DataSource])
], RequisitionsService);
export { RequisitionsService };
//# sourceMappingURL=requisitions.service.js.map