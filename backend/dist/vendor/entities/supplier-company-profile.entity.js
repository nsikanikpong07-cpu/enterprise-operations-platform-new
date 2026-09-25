var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';
import { Supplier } from './supplier.entity.js';
let SupplierCompanyProfile = class SupplierCompanyProfile extends BaseEntity {
    supplier;
    company;
    supplierCode;
    relationshipStatus;
    onboardingStatus;
    notes;
};
__decorate([
    ManyToOne(() => Supplier, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'supplier_id' }),
    __metadata("design:type", Supplier)
], SupplierCompanyProfile.prototype, "supplier", void 0);
__decorate([
    ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'company_id' }),
    __metadata("design:type", Company)
], SupplierCompanyProfile.prototype, "company", void 0);
__decorate([
    Index(),
    Column({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], SupplierCompanyProfile.prototype, "supplierCode", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, nullable: false, default: 'prospective' }),
    __metadata("design:type", String)
], SupplierCompanyProfile.prototype, "relationshipStatus", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, nullable: false, default: 'pending' }),
    __metadata("design:type", String)
], SupplierCompanyProfile.prototype, "onboardingStatus", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SupplierCompanyProfile.prototype, "notes", void 0);
SupplierCompanyProfile = __decorate([
    Entity({ schema: 'vendor', name: 'supplier_company_profiles' }),
    Unique(['supplier', 'company']),
    Unique(['company', 'supplierCode']),
    Check(`relationship_status IN ('prospective', 'active', 'suspended', 'blocked', 'inactive')`),
    Check(`onboarding_status IN ('pending', 'in_progress', 'completed', 'rejected')`)
], SupplierCompanyProfile);
export { SupplierCompanyProfile };
//# sourceMappingURL=supplier-company-profile.entity.js.map