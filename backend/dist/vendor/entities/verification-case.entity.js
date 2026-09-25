var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../iam/entities/user.entity.js';
import { SupplierCompanyProfile } from './supplier-company-profile.entity.js';
let VerificationCase = class VerificationCase extends BaseEntity {
    companyProfile;
    caseNumber;
    verificationType;
    status;
    openedBy;
    openedAt;
    completedAt;
    expiresAt;
};
__decorate([
    ManyToOne(() => SupplierCompanyProfile, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'supplier_company_profile_id' }),
    __metadata("design:type", SupplierCompanyProfile)
], VerificationCase.prototype, "companyProfile", void 0);
__decorate([
    Index({ unique: true }),
    Column({ type: 'varchar', length: 100, nullable: false, unique: true }),
    __metadata("design:type", String)
], VerificationCase.prototype, "caseNumber", void 0);
__decorate([
    Column({ type: 'varchar', length: 50, nullable: false, default: 'initial' }),
    __metadata("design:type", String)
], VerificationCase.prototype, "verificationType", void 0);
__decorate([
    Index(),
    Column({ type: 'varchar', length: 30, nullable: false, default: 'open' }),
    __metadata("design:type", String)
], VerificationCase.prototype, "status", void 0);
__decorate([
    ManyToOne(() => User, { nullable: false }),
    JoinColumn({ name: 'opened_by' }),
    __metadata("design:type", User)
], VerificationCase.prototype, "openedBy", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: false, default: () => 'NOW()' }),
    __metadata("design:type", Date)
], VerificationCase.prototype, "openedAt", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], VerificationCase.prototype, "completedAt", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], VerificationCase.prototype, "expiresAt", void 0);
VerificationCase = __decorate([
    Entity({ schema: 'vendor', name: 'verification_cases' }),
    Check(`verification_type IN ('initial', 'periodic', 'renewal', 're_verification')`),
    Check(`status IN ('open', 'in_progress', 'approved', 'rejected', 'expired', 'cancelled')`)
], VerificationCase);
export { VerificationCase };
//# sourceMappingURL=verification-case.entity.js.map