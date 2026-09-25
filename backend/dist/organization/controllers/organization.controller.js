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
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, } from '@nestjs/common';
import { CreateCompanyDto, CreateDepartmentDto, CreateLocationDto, UpdateCompanyDto, UpdateDepartmentDto, UpdateLocationDto, } from '../dto/organization.dto.js';
import { OrganizationService } from '../providers/organization.service.js';
let OrganizationController = class OrganizationController {
    organization;
    constructor(organization) {
        this.organization = organization;
    }
    findCompanies() {
        return this.organization.findCompanies();
    }
    findCompany(id) {
        return this.organization.findCompany(id);
    }
    createCompany(dto) {
        return this.organization.createCompany(dto);
    }
    updateCompany(id, dto) {
        return this.organization.updateCompany(id, dto);
    }
    removeCompany(id) {
        return this.organization.removeCompany(id);
    }
    findDepartments(companyId) {
        return this.organization.findDepartments(companyId);
    }
    createDepartment(dto) {
        return this.organization.createDepartment(dto);
    }
    updateDepartment(id, dto) {
        return this.organization.updateDepartment(id, dto);
    }
    removeDepartment(id) {
        return this.organization.removeDepartment(id);
    }
    findLocations(companyId) {
        return this.organization.findLocations(companyId);
    }
    createLocation(dto) {
        return this.organization.createLocation(dto);
    }
    updateLocation(id, dto) {
        return this.organization.updateLocation(id, dto);
    }
    removeLocation(id) {
        return this.organization.removeLocation(id);
    }
};
__decorate([
    Get('companies'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "findCompanies", null);
__decorate([
    Get('companies/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "findCompany", null);
__decorate([
    Post('companies'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateCompanyDto]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "createCompany", null);
__decorate([
    Patch('companies/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateCompanyDto]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "updateCompany", null);
__decorate([
    Delete('companies/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "removeCompany", null);
__decorate([
    Get('companies/:companyId/departments'),
    __param(0, Param('companyId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "findDepartments", null);
__decorate([
    Post('departments'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateDepartmentDto]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "createDepartment", null);
__decorate([
    Patch('departments/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateDepartmentDto]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "updateDepartment", null);
__decorate([
    Delete('departments/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "removeDepartment", null);
__decorate([
    Get('companies/:companyId/locations'),
    __param(0, Param('companyId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "findLocations", null);
__decorate([
    Post('locations'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateLocationDto]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "createLocation", null);
__decorate([
    Patch('locations/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateLocationDto]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "updateLocation", null);
__decorate([
    Delete('locations/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationController.prototype, "removeLocation", null);
OrganizationController = __decorate([
    Controller('organization'),
    __metadata("design:paramtypes", [OrganizationService])
], OrganizationController);
export { OrganizationController };
//# sourceMappingURL=organization.controller.js.map