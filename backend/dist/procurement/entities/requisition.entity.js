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
import { Department } from '../../organization/entities/department.entity.js';
import { CompanyUser } from '../../iam/entities/company-user.entity.js';
let Requisition = class Requisition extends BaseEntity {
    company;
    requisitionNumber;
    requester;
    department;
    requestDate;
    requiredDate;
    status;
    justification;
    approvalStatus;
    totalEstimatedAmount;
};
__decorate([
    ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'company_id' }),
    __metadata("design:type", Company)
], Requisition.prototype, "company", void 0);
__decorate([
    Index({ unique: true }),
    Column({ type: 'varchar', length: 50, nullable: false, unique: true }),
    __metadata("design:type", String)
], Requisition.prototype, "requisitionNumber", void 0);
__decorate([
    ManyToOne(() => CompanyUser, { nullable: false }),
    JoinColumn({ name: 'requester_id' }),
    __metadata("design:type", CompanyUser)
], Requisition.prototype, "requester", void 0);
__decorate([
    ManyToOne(() => Department, { nullable: true }),
    JoinColumn({ name: 'department_id' }),
    __metadata("design:type", Department)
], Requisition.prototype, "department", void 0);
__decorate([
    Column({ type: 'date', nullable: false, default: () => 'CURRENT_DATE' }),
    __metadata("design:type", Date)
], Requisition.prototype, "requestDate", void 0);
__decorate([
    Column({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Requisition.prototype, "requiredDate", void 0);
__decorate([
    Index(),
    Column({ type: 'varchar', length: 30, nullable: false, default: 'Draft' }),
    __metadata("design:type", String)
], Requisition.prototype, "status", void 0);
__decorate([
    Column({ type: 'varchar', length: 500, nullable: false }),
    __metadata("design:type", String)
], Requisition.prototype, "justification", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, nullable: false, default: 'Pending' }),
    __metadata("design:type", String)
], Requisition.prototype, "approvalStatus", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Requisition.prototype, "totalEstimatedAmount", void 0);
Requisition = __decorate([
    Entity({ schema: 'procurement', name: 'requisitions' }),
    Unique(['company', 'requisitionNumber']),
    Check(`status IN ('Draft', 'Submitted', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed')`),
    Check(`approval_status IN ('Pending', 'Approved', 'Rejected')`),
    Check(`total_estimated_amount IS NULL OR total_estimated_amount >= 0`)
], Requisition);
export { Requisition };
//# sourceMappingURL=requisition.entity.js.map