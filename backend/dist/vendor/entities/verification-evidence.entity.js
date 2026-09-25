var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../iam/entities/user.entity.js';
import { SupplierDocument } from './supplier-document.entity.js';
import { VerificationCheck } from './verification-check.entity.js';
let VerificationEvidence = class VerificationEvidence extends BaseEntity {
    check;
    supplierDocument;
    evidenceType;
    fileUrl;
    description;
    uploadedBy;
};
__decorate([
    ManyToOne(() => VerificationCheck, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'verification_check_id' }),
    __metadata("design:type", VerificationCheck)
], VerificationEvidence.prototype, "check", void 0);
__decorate([
    ManyToOne(() => SupplierDocument, { nullable: true }),
    JoinColumn({ name: 'supplier_document_id' }),
    __metadata("design:type", SupplierDocument)
], VerificationEvidence.prototype, "supplierDocument", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: false }),
    __metadata("design:type", String)
], VerificationEvidence.prototype, "evidenceType", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], VerificationEvidence.prototype, "fileUrl", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], VerificationEvidence.prototype, "description", void 0);
__decorate([
    ManyToOne(() => User, { nullable: false }),
    JoinColumn({ name: 'uploaded_by' }),
    __metadata("design:type", User)
], VerificationEvidence.prototype, "uploadedBy", void 0);
VerificationEvidence = __decorate([
    Entity({ schema: 'vendor', name: 'verification_evidence' })
], VerificationEvidence);
export { VerificationEvidence };
//# sourceMappingURL=verification-evidence.entity.js.map