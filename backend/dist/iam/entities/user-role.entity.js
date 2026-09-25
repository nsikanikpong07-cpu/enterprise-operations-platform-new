var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, } from 'typeorm';
import { Role } from './role.entity.js';
import { CompanyUser } from './company-user.entity.js';
let UserRole = class UserRole {
    id;
    companyUser;
    role;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], UserRole.prototype, "id", void 0);
__decorate([
    ManyToOne(() => CompanyUser, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'company_user_id' }),
    __metadata("design:type", CompanyUser)
], UserRole.prototype, "companyUser", void 0);
__decorate([
    ManyToOne(() => Role, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'role_id' }),
    __metadata("design:type", Role)
], UserRole.prototype, "role", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' }),
    __metadata("design:type", Date)
], UserRole.prototype, "createdAt", void 0);
UserRole = __decorate([
    Entity({ schema: 'iam', name: 'user_roles' }),
    Unique(['companyUser', 'role'])
], UserRole);
export { UserRole };
//# sourceMappingURL=user-role.entity.js.map