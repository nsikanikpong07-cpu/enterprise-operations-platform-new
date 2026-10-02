var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
let Company = class Company {
    id;
    createdAt;
    updatedAt;
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
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Company.prototype, "id", void 0);
__decorate([
    CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], Company.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Company.prototype, "updatedAt", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Company.prototype, "name", void 0);
__decorate([
    Column({ name: 'legal_name', nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "legalName", void 0);
__decorate([
    Column({ name: 'registration_number', nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "registrationNumber", void 0);
__decorate([
    Column({ name: 'tax_identification_number', nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "taxIdentificationNumber", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "industry", void 0);
__decorate([
    Column({ name: 'country_code', nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "countryCode", void 0);
__decorate([
    Column({ name: 'default_currency', nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "defaultCurrency", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Company.prototype, "timezone", void 0);
__decorate([
    Column({ default: 'Active' }),
    __metadata("design:type", String)
], Company.prototype, "status", void 0);
Company = __decorate([
    Entity({ schema: 'organization', name: 'companies' })
], Company);
export { Company };
//# sourceMappingURL=company.entity.js.map