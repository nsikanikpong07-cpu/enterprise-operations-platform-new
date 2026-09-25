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
import { SupplierCompanyProfile } from './supplier-company-profile.entity.js';
import { Supplier } from './supplier.entity.js';
let SupplierDocument = class SupplierDocument extends BaseEntity {
    supplier;
    companyProfile;
    documentType;
    documentNumber;
    fileUrl;
    fileHash;
    issuedAt;
    expiresAt;
    status;
    uploadedBy;
};
__decorate([
    ManyToOne(() => Supplier, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'supplier_id' }),
    __metadata("design:type", Supplier)
], SupplierDocument.prototype, "supplier", void 0);
__decorate([
    ManyToOne(() => SupplierCompanyProfile, { nullable: true, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'supplier_company_profile_id' }),
    __metadata("design:type", SupplierCompanyProfile)
], SupplierDocument.prototype, "companyProfile", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: false }),
    __metadata("design:type", String)
], SupplierDocument.prototype, "documentType", void 0);
__decorate([
    Column({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", String)
], SupplierDocument.prototype, "documentNumber", void 0);
__decorate([
    Column({ type: 'text', nullable: false }),
    __metadata("design:type", String)
], SupplierDocument.prototype, "fileUrl", void 0);
__decorate([
    Column({ type: 'varchar', length: 128, nullable: true }),
    __metadata("design:type", String)
], SupplierDocument.prototype, "fileHash", void 0);
__decorate([
    Column({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], SupplierDocument.prototype, "issuedAt", void 0);
__decorate([
    Column({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], SupplierDocument.prototype, "expiresAt", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, nullable: false, default: 'pending' }),
    __metadata("design:type", String)
], SupplierDocument.prototype, "status", void 0);
__decorate([
    ManyToOne(() => User, { nullable: true }),
    JoinColumn({ name: 'uploaded_by' }),
    __metadata("design:type", User)
], SupplierDocument.prototype, "uploadedBy", void 0);
SupplierDocument = __decorate([
    Entity({ schema: 'vendor', name: 'supplier_documents' }),
    Check(`status IN ('pending', 'valid', 'expired', 'rejected')`)
], SupplierDocument);
export { SupplierDocument };
//# sourceMappingURL=supplier-document.entity.js.map