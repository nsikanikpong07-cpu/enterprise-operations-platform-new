var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Check, Column, Entity, JoinColumn, ManyToOne, Unique, } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { CompanyUser } from '../../iam/entities/company-user.entity.js';
import { Company } from './company.entity.js';
let Department = class Department extends BaseEntity {
    company;
    name;
    code;
    manager;
};
__decorate([
    ManyToOne(() => Company, {
        nullable: false,
        onDelete: 'CASCADE',
    }),
    JoinColumn({ name: 'company_id' }),
    __metadata("design:type", Company)
], Department.prototype, "company", void 0);
__decorate([
    Column({ type: 'varchar', length: 150, nullable: false }),
    __metadata("design:type", String)
], Department.prototype, "name", void 0);
__decorate([
    Column({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], Department.prototype, "code", void 0);
__decorate([
    ManyToOne(() => CompanyUser, { nullable: true }),
    JoinColumn({ name: 'manager_company_user_id' }),
    __metadata("design:type", CompanyUser)
], Department.prototype, "manager", void 0);
Department = __decorate([
    Entity({ schema: 'organization', name: 'departments' }),
    Unique(['company', 'name']),
    Unique(['company', 'code']),
    Check(`btrim(name) <> ''`)
], Department);
export { Department };
//# sourceMappingURL=department.entity.js.map