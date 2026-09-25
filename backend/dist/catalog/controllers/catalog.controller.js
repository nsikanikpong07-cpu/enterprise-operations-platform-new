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
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, } from '@nestjs/common';
import { CreateItemCategoryDto, CreateUnitOfMeasureDto, UpdateItemCategoryDto, } from '../dto/catalog.dto.js';
import { CatalogService } from '../providers/catalog.service.js';
let CatalogController = class CatalogController {
    catalog;
    constructor(catalog) {
        this.catalog = catalog;
    }
    findCategories(companyId) {
        return this.catalog.findCategories(companyId);
    }
    findCategory(id) {
        return this.catalog.findCategory(id);
    }
    createCategory(dto) {
        return this.catalog.createCategory(dto);
    }
    updateCategory(id, dto) {
        return this.catalog.updateCategory(id, dto);
    }
    removeCategory(id) {
        return this.catalog.removeCategory(id);
    }
    findUnits() {
        return this.catalog.findUnits();
    }
    createUnit(dto) {
        return this.catalog.createUnit(dto);
    }
};
__decorate([
    Get('categories'),
    __param(0, Query('companyId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "findCategories", null);
__decorate([
    Get('categories/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "findCategory", null);
__decorate([
    Post('categories'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateItemCategoryDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "createCategory", null);
__decorate([
    Patch('categories/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateItemCategoryDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "updateCategory", null);
__decorate([
    Delete('categories/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "removeCategory", null);
__decorate([
    Get('units'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "findUnits", null);
__decorate([
    Post('units'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateUnitOfMeasureDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "createUnit", null);
CatalogController = __decorate([
    Controller('catalog'),
    __metadata("design:paramtypes", [CatalogService])
], CatalogController);
export { CatalogController };
//# sourceMappingURL=catalog.controller.js.map