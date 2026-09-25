var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';
import { User } from '../../iam/entities/user.entity.js';
let AuditLog = class AuditLog extends BaseEntity {
    company;
    user;
    action;
    entityType;
    entityId;
    oldValues;
    newValues;
    ipAddress;
    userAgent;
};
__decorate([
    ManyToOne(() => Company, { nullable: true, onDelete: 'SET NULL' }),
    JoinColumn({ name: 'company_id' }),
    __metadata("design:type", Company)
], AuditLog.prototype, "company", void 0);
__decorate([
    ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }),
    JoinColumn({ name: 'user_id' }),
    __metadata("design:type", User)
], AuditLog.prototype, "user", void 0);
__decorate([
    Index(),
    Column({ type: 'varchar', length: 100, nullable: false }),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    Index(),
    Column({ type: 'varchar', length: 100, nullable: false }),
    __metadata("design:type", String)
], AuditLog.prototype, "entityType", void 0);
__decorate([
    Column({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "entityId", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "oldValues", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "newValues", void 0);
__decorate([
    Column({ type: 'inet', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "ipAddress", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "userAgent", void 0);
AuditLog = __decorate([
    Entity({ schema: 'audit', name: 'audit_logs' })
], AuditLog);
export { AuditLog };
//# sourceMappingURL=audit-log.entity.js.map