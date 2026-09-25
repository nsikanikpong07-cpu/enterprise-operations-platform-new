var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Check, Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
let Company = class Company extends BaseEntity {
    name;
    legalName;
    registrationNumber;
    taxIdentificationNumber;
    industry;
    countryCode;
    defaultCurrency;
    timezone;
    status;
};
__decorate([
    Column({ type: 'varchar', length: 255, nullable: false }),
    __metadata("design:type", String)
], Company.prototype, "name", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "legalName", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "registrationNumber", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "taxIdentificationNumber", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "industry", void 0);
__decorate([
    Column({ type: 'char', length: 2, nullable: false, default: 'NG' }),
    __metadata("design:type", String)
], Company.prototype, "countryCode", void 0);
__decorate([
    Column({ type: 'char', length: 3, nullable: false, default: 'NGN' }),
    __metadata("design:type", String)
], Company.prototype, "defaultCurrency", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: false, default: 'Africa/Lagos' }),
    __metadata("design:type", String)
], Company.prototype, "timezone", void 0);
__decorate([
    Index(),
    Column({ type: 'varchar', length: 30, nullable: false, default: 'active' }),
    __metadata("design:type", String)
], Company.prototype, "status", void 0);
Company = __decorate([
    Entity({ schema: 'organization', name: 'companies' }),
    Check(`status IN ('active', 'suspended', 'inactive')`)
], Company);
export { Company };
//# sourceMappingURL=company.entity.js.map