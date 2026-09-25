var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Check, Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { CompanyUser } from '../../iam/entities/company-user.entity.js';
import { Requisition } from './requisition.entity.js';
let Approval = class Approval extends BaseEntity {
    requisition;
    approver;
    approvalLevel;
    approvalStatus;
    approvalDate;
    comments;
    rejectionReason;
};
__decorate([
    ManyToOne(() => Requisition, {
        nullable: false,
        onDelete: 'CASCADE',
    }),
    JoinColumn({ name: 'requisition_id' }),
    __metadata("design:type", Requisition)
], Approval.prototype, "requisition", void 0);
__decorate([
    ManyToOne(() => CompanyUser, { nullable: false }),
    JoinColumn({ name: 'approver_id' }),
    __metadata("design:type", CompanyUser)
], Approval.prototype, "approver", void 0);
__decorate([
    Column({ type: 'int', nullable: false }),
    __metadata("design:type", Number)
], Approval.prototype, "approvalLevel", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, nullable: false, default: 'Pending' }),
    __metadata("design:type", String)
], Approval.prototype, "approvalStatus", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Approval.prototype, "approvalDate", void 0);
__decorate([
    Column({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], Approval.prototype, "comments", void 0);
__decorate([
    Column({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], Approval.prototype, "rejectionReason", void 0);
Approval = __decorate([
    Entity({ schema: 'procurement', name: 'approvals' }),
    Unique(['requisition', 'approvalLevel']),
    Check(`approval_status IN ('Pending', 'Approved', 'Rejected')`),
    Check(`approval_level > 0`)
], Approval);
export { Approval };
//# sourceMappingURL=approval.entity.js.map