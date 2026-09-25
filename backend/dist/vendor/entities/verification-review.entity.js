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
let VerificationReview = class VerificationReview extends BaseEntity {
    verificationCase;
    reviewer;
    decision;
    comments;
    reviewedAt;
};
__decorate([
    ManyToOne(() => VerificationCase, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'verification_case_id' }),
    __metadata("design:type", VerificationCase)
], VerificationReview.prototype, "verificationCase", void 0);
__decorate([
    ManyToOne(() => User, { nullable: false }),
    JoinColumn({ name: 'reviewer_user_id' }),
    __metadata("design:type", User)
], VerificationReview.prototype, "reviewer", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, nullable: false }),
    __metadata("design:type", String)
], VerificationReview.prototype, "decision", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], VerificationReview.prototype, "comments", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: false, default: () => 'NOW()' }),
    __metadata("design:type", Date)
], VerificationReview.prototype, "reviewedAt", void 0);
VerificationReview = __decorate([
    Entity({ schema: 'vendor', name: 'verification_reviews' }),
    Check(`decision IN ('approved', 'rejected', 'requires_changes')`)
], VerificationReview);
export { VerificationReview };
//# sourceMappingURL=verification-review.entity.js.map