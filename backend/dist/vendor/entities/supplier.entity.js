var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Check, Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
let Supplier = class Supplier extends BaseEntity {
    legalName;
    tradingName;
    registrationNumber;
    taxIdentificationNumber;
    supplierType;
    countryCode;
    status;
};
__decorate([
    Column({ type: 'varchar', length: 255, nullable: false }),
    __metadata("design:type", String)
], Supplier.prototype, "legalName", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Supplier.prototype, "tradingName", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Supplier.prototype, "registrationNumber", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Supplier.prototype, "taxIdentificationNumber", void 0);
__decorate([
    Column({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], Supplier.prototype, "supplierType", void 0);
__decorate([
    Column({ type: 'char', length: 2, nullable: true }),
    __metadata("design:type", String)
], Supplier.prototype, "countryCode", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, nullable: false, default: 'active' }),
    __metadata("design:type", String)
], Supplier.prototype, "status", void 0);
Supplier = __decorate([
    Entity({ schema: 'vendor', name: 'suppliers' }),
    Check(`status IN ('active', 'inactive', 'suspended')`)
], Supplier);
export { Supplier };
//# sourceMappingURL=supplier.entity.js.map