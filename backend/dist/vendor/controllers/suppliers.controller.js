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
import { CreateSupplierContactDto, CreateSupplierDocumentDto, CreateSupplierDto, OnboardSupplierDto, UpdateSupplierDto, UpdateSupplierProfileDto, } from '../dto/vendor.dto.js';
import { SuppliersService } from '../providers/suppliers.service.js';
let SuppliersController = class SuppliersController {
    suppliers;
    constructor(suppliers) {
        this.suppliers = suppliers;
    }
    findAll() {
        return this.suppliers.findAll();
    }
    findOne(id) {
        return this.suppliers.findOne(id);
    }
    create(dto) {
        return this.suppliers.create(dto);
    }
    update(id, dto) {
        return this.suppliers.update(id, dto);
    }
    onboard(dto) {
        return this.suppliers.onboard(dto);
    }
    profilesForCompany(companyId) {
        return this.suppliers.profilesForCompany(companyId);
    }
    updateProfile(id, dto) {
        return this.suppliers.updateProfile(id, dto);
    }
    addContact(dto) {
        return this.suppliers.addContact(dto);
    }
    contactsFor(id) {
        return this.suppliers.contactsFor(id);
    }
    addDocument(dto) {
        return this.suppliers.addDocument(dto);
    }
    documentsFor(id) {
        return this.suppliers.documentsFor(id);
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "findAll", null);
__decorate([
    Get(':id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "findOne", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateSupplierDto]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "create", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateSupplierDto]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "update", null);
__decorate([
    Post('onboard'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [OnboardSupplierDto]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "onboard", null);
__decorate([
    Get('profiles'),
    __param(0, Query('companyId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "profilesForCompany", null);
__decorate([
    Patch('profiles/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateSupplierProfileDto]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "updateProfile", null);
__decorate([
    Post('contacts'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateSupplierContactDto]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "addContact", null);
__decorate([
    Get(':id/contacts'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "contactsFor", null);
__decorate([
    Post('documents'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateSupplierDocumentDto]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "addDocument", null);
__decorate([
    Get(':id/documents'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "documentsFor", null);
SuppliersController = __decorate([
    Controller('vendor/suppliers'),
    __metadata("design:paramtypes", [SuppliersService])
], SuppliersController);
export { SuppliersController };
//# sourceMappingURL=suppliers.controller.js.map