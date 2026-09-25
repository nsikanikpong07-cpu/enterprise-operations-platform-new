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
import { Company } from '../../organization/entities/company.entity.js';
import { User } from './user.entity.js';
let CompanyUser = class CompanyUser extends BaseEntity {
    company;
    user;
    departmentId;
    employeeNumber;
    jobTitle;
    status;
};
__decorate([
    ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'company_id' }),
    __metadata("design:type", Company)
], CompanyUser.prototype, "company", void 0);
__decorate([
    ManyToOne(() => User, {
        nullable: false,
        onDelete: 'CASCADE',
    }),
    JoinColumn({ name: 'user_id' }),
    __metadata("design:type", User)
], CompanyUser.prototype, "user", void 0);
__decorate([
    Index(),
    Column({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanyUser.prototype, "departmentId", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], CompanyUser.prototype, "employeeNumber", void 0);
__decorate([
    Column({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", String)
], CompanyUser.prototype, "jobTitle", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, nullable: false, default: 'active' }),
    __metadata("design:type", String)
], CompanyUser.prototype, "status", void 0);
CompanyUser = __decorate([
    Entity({ schema: 'iam', name: 'company_users' }),
    Unique(['company', 'user']),
    Unique(['company', 'employeeNumber']),
    Check(`status IN ('active', 'suspended', 'inactive')`)
], CompanyUser);
export { CompanyUser };
//# sourceMappingURL=company-user.entity.js.map