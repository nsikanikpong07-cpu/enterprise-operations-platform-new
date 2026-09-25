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
import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, } from '@nestjs/common';
import { CreateRequisitionDto, UpdateRequisitionDto, } from '../dto/procurement.dto.js';
import { RequisitionsService } from '../providers/requisitions.service.js';
let RequisitionsController = class RequisitionsController {
    requisitions;
    constructor(requisitions) {
        this.requisitions = requisitions;
    }
    findAll(companyId) {
        return this.requisitions.findAll(companyId);
    }
    findOne(id) {
        return this.requisitions.findOne(id);
    }
    itemsFor(id) {
        return this.requisitions.itemsFor(id);
    }
    create(dto) {
        return this.requisitions.create(dto);
    }
    update(id, dto) {
        return this.requisitions.update(id, dto);
    }
};
__decorate([
    Get(),
    __param(0, Query('companyId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RequisitionsController.prototype, "findAll", null);
__decorate([
    Get(':id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RequisitionsController.prototype, "findOne", null);
__decorate([
    Get(':id/items'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RequisitionsController.prototype, "itemsFor", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateRequisitionDto]),
    __metadata("design:returntype", void 0)
], RequisitionsController.prototype, "create", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateRequisitionDto]),
    __metadata("design:returntype", void 0)
], RequisitionsController.prototype, "update", null);
RequisitionsController = __decorate([
    Controller('procurement/requisitions'),
    __metadata("design:paramtypes", [RequisitionsService])
], RequisitionsController);
export { RequisitionsController };
//# sourceMappingURL=requisitions.controller.js.map