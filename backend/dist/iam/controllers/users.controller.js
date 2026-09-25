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
import { AddCompanyUserDto, UpdateCompanyUserDto, } from '../dto/role.dto.js';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto.js';
import { UsersService } from '../providers/users.service.js';
let UsersController = class UsersController {
    users;
    constructor(users) {
        this.users = users;
    }
    findAll() {
        return this.users.findAll();
    }
    findOne(id) {
        return this.users.findOne(id);
    }
    create(dto) {
        return this.users.create(dto);
    }
    update(id, dto) {
        return this.users.update(id, dto);
    }
    remove(id) {
        return this.users.remove(id);
    }
    findCompanyUsers(companyId) {
        return this.users.findCompanyUsers(companyId);
    }
    addToCompany(dto) {
        return this.users.addToCompany(dto);
    }
    updateCompanyUser(id, dto) {
        return this.users.updateCompanyUser(id, dto);
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    Get(':id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "update", null);
__decorate([
    Delete(':id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "remove", null);
__decorate([
    Get('companies/:companyId/members'),
    __param(0, Param('companyId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findCompanyUsers", null);
__decorate([
    Post('memberships'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AddCompanyUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "addToCompany", null);
__decorate([
    Patch('memberships/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateCompanyUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateCompanyUser", null);
UsersController = __decorate([
    Controller('iam/users'),
    __metadata("design:paramtypes", [UsersService])
], UsersController);
export { UsersController };
//# sourceMappingURL=users.controller.js.map