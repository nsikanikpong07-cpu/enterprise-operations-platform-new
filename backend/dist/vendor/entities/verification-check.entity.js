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
let VerificationCheck = class VerificationCheck extends BaseEntity {
    verificationCase;
    checkType;
    name;
    status;
    isRequired;
    checkedBy;
    checkedAt;
    notes;
};
__decorate([
    ManyToOne(() => VerificationCase, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'verification_case_id' }),
    __metadata("design:type", VerificationCase)
], VerificationCheck.prototype, "verificationCase", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: false }),
    __metadata("design:type", String)
], VerificationCheck.prototype, "checkType", void 0);
__decorate([
    Column({ type: 'varchar', length: 150, nullable: false }),
    __metadata("design:type", String)
], VerificationCheck.prototype, "name", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, nullable: false, default: 'pending' }),
    __metadata("design:type", String)
], VerificationCheck.prototype, "status", void 0);
__decorate([
    Column({ type: 'boolean', nullable: false, default: true }),
    __metadata("design:type", Boolean)
], VerificationCheck.prototype, "isRequired", void 0);
__decorate([
    ManyToOne(() => User, { nullable: true }),
    JoinColumn({ name: 'checked_by' }),
    __metadata("design:type", User)
], VerificationCheck.prototype, "checkedBy", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], VerificationCheck.prototype, "checkedAt", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], VerificationCheck.prototype, "notes", void 0);
VerificationCheck = __decorate([
    Entity({ schema: 'vendor', name: 'verification_checks' }),
    Check(`status IN ('pending', 'in_progress', 'passed', 'failed', 'waived')`)
], VerificationCheck);
export { VerificationCheck };
//# sourceMappingURL=verification-check.entity.js.map