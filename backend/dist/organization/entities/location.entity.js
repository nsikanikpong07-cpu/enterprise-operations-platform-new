var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique, } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from './company.entity.js';
let Location = class Location extends BaseEntity {
    company;
    name;
    code;
    type;
    address;
    city;
    state;
    countryCode;
    isActive;
};
__decorate([
    ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'company_id' }),
    __metadata("design:type", Company)
], Location.prototype, "company", void 0);
__decorate([
    Column({ type: 'varchar', length: 150, nullable: false }),
    __metadata("design:type", String)
], Location.prototype, "name", void 0);
__decorate([
    Index(),
    Column({ type: 'varchar', length: 50, nullable: false }),
    __metadata("design:type", String)
], Location.prototype, "code", void 0);
__decorate([
    Column({ type: 'varchar', length: 50, nullable: false, default: 'office' }),
    __metadata("design:type", String)
], Location.prototype, "type", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Location.prototype, "address", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Location.prototype, "city", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Location.prototype, "state", void 0);
__decorate([
    Column({ type: 'char', length: 2, nullable: true }),
    __metadata("design:type", String)
], Location.prototype, "countryCode", void 0);
__decorate([
    Column({ type: 'boolean', nullable: false, default: true }),
    __metadata("design:type", Boolean)
], Location.prototype, "isActive", void 0);
Location = __decorate([
    Entity({ schema: 'organization', name: 'locations' }),
    Unique(['company', 'code']),
    Check(`type IN ('office', 'warehouse', 'branch', 'site', 'factory', 'other')`)
], Location);
export { Location };
//# sourceMappingURL=location.entity.js.map