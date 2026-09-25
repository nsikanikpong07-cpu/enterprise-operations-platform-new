var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../iam/entities/user.entity.js';
import { VerificationCase } from './verification-case.entity.js';
let SupplierRiskAssessment = class SupplierRiskAssessment extends BaseEntity {
    verificationCase;
    riskLevel;
    riskScore;
    rationale;
    assessedBy;
    assessedAt;
    expiresAt;
};
__decorate([
    ManyToOne(() => VerificationCase, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'verification_case_id' }),
    __metadata("design:type", VerificationCase)
], SupplierRiskAssessment.prototype, "verificationCase", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, nullable: false }),
    __metadata("design:type", String)
], SupplierRiskAssessment.prototype, "riskLevel", void 0);
__decorate([
    Column({ type: 'numeric', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], SupplierRiskAssessment.prototype, "riskScore", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SupplierRiskAssessment.prototype, "rationale", void 0);
__decorate([
    ManyToOne(() => User, { nullable: false }),
    JoinColumn({ name: 'assessed_by' }),
    __metadata("design:type", User)
], SupplierRiskAssessment.prototype, "assessedBy", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: false, default: () => 'NOW()' }),
    __metadata("design:type", Date)
], SupplierRiskAssessment.prototype, "assessedAt", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], SupplierRiskAssessment.prototype, "expiresAt", void 0);
SupplierRiskAssessment = __decorate([
    Entity({ schema: 'vendor', name: 'supplier_risk_assessments' }),
    Check(`risk_level IN ('low', 'medium', 'high', 'critical')`),
    Check(`risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100)`)
], SupplierRiskAssessment);
export { SupplierRiskAssessment };
//# sourceMappingURL=supplier-risk-assessment.entity.js.map