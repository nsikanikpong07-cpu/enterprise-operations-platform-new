var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, Length, MaxLength, } from 'class-validator';
export class CreateCompanyDto {
    name;
    legalName;
    registrationNumber;
    taxIdentificationNumber;
    industry;
    countryCode;
    defaultCurrency;
    timezone;
}
__decorate([
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "legalName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "registrationNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "taxIdentificationNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "industry", void 0);
__decorate([
    IsOptional(),
    IsString(),
    Length(2, 2),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "countryCode", void 0);
__decorate([
    IsOptional(),
    IsString(),
    Length(3, 3),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "defaultCurrency", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateCompanyDto.prototype, "timezone", void 0);
export class UpdateCompanyDto {
    name;
    legalName;
    industry;
    status;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "legalName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "industry", void 0);
__decorate([
    IsOptional(),
    IsIn(['active', 'suspended', 'inactive']),
    __metadata("design:type", String)
], UpdateCompanyDto.prototype, "status", void 0);
export class CreateDepartmentDto {
    companyId;
    name;
    code;
    managerId;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateDepartmentDto.prototype, "companyId", void 0);
__decorate([
    IsString(),
    MaxLength(150),
    __metadata("design:type", String)
], CreateDepartmentDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateDepartmentDto.prototype, "code", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], CreateDepartmentDto.prototype, "managerId", void 0);
export class UpdateDepartmentDto {
    name;
    code;
    managerId;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(150),
    __metadata("design:type", String)
], UpdateDepartmentDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateDepartmentDto.prototype, "code", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], UpdateDepartmentDto.prototype, "managerId", void 0);
export class CreateLocationDto {
    companyId;
    name;
    code;
    type;
    address;
    city;
    state;
    countryCode;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "companyId", void 0);
__decorate([
    IsString(),
    MaxLength(150),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "name", void 0);
__decorate([
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "code", void 0);
__decorate([
    IsOptional(),
    IsIn(['office', 'warehouse', 'branch', 'site', 'factory', 'other']),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "address", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "city", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "state", void 0);
__decorate([
    IsOptional(),
    IsString(),
    Length(2, 2),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "countryCode", void 0);
export class UpdateLocationDto {
    name;
    address;
    isActive;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(150),
    __metadata("design:type", String)
], UpdateLocationDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateLocationDto.prototype, "address", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateLocationDto.prototype, "isActive", void 0);
//# sourceMappingURL=organization.dto.js.map