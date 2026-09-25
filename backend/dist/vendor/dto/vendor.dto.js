var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsBoolean, IsDateString, IsEmail, IsIn, IsNumber, IsOptional, IsString, IsUUID, Length, Max, MaxLength, Min, } from 'class-validator';
export class CreateSupplierDto {
    legalName;
    tradingName;
    registrationNumber;
    taxIdentificationNumber;
    supplierType;
    countryCode;
}
__decorate([
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "legalName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "tradingName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "registrationNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "taxIdentificationNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "supplierType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    Length(2, 2),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "countryCode", void 0);
export class UpdateSupplierDto {
    tradingName;
    supplierType;
    status;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "tradingName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "supplierType", void 0);
__decorate([
    IsOptional(),
    IsIn(['active', 'inactive', 'suspended']),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "status", void 0);
export class OnboardSupplierDto {
    supplierId;
    companyId;
    supplierCode;
    notes;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], OnboardSupplierDto.prototype, "supplierId", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], OnboardSupplierDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], OnboardSupplierDto.prototype, "supplierCode", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], OnboardSupplierDto.prototype, "notes", void 0);
export class UpdateSupplierProfileDto {
    supplierCode;
    relationshipStatus;
    onboardingStatus;
    notes;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdateSupplierProfileDto.prototype, "supplierCode", void 0);
__decorate([
    IsOptional(),
    IsIn(['prospective', 'active', 'suspended', 'blocked', 'inactive']),
    __metadata("design:type", String)
], UpdateSupplierProfileDto.prototype, "relationshipStatus", void 0);
__decorate([
    IsOptional(),
    IsIn(['pending', 'in_progress', 'completed', 'rejected']),
    __metadata("design:type", String)
], UpdateSupplierProfileDto.prototype, "onboardingStatus", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateSupplierProfileDto.prototype, "notes", void 0);
export class CreateSupplierContactDto {
    supplierId;
    name;
    email;
    phone;
    position;
    isPrimary;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateSupplierContactDto.prototype, "supplierId", void 0);
__decorate([
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreateSupplierContactDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    __metadata("design:type", String)
], CreateSupplierContactDto.prototype, "email", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateSupplierContactDto.prototype, "phone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(150),
    __metadata("design:type", String)
], CreateSupplierContactDto.prototype, "position", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateSupplierContactDto.prototype, "isPrimary", void 0);
export class CreateSupplierDocumentDto {
    supplierId;
    companyProfileId;
    documentType;
    documentNumber;
    fileUrl;
    fileHash;
    issuedAt;
    expiresAt;
    uploadedById;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateSupplierDocumentDto.prototype, "supplierId", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], CreateSupplierDocumentDto.prototype, "companyProfileId", void 0);
__decorate([
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateSupplierDocumentDto.prototype, "documentType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(150),
    __metadata("design:type", String)
], CreateSupplierDocumentDto.prototype, "documentNumber", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateSupplierDocumentDto.prototype, "fileUrl", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(128),
    __metadata("design:type", String)
], CreateSupplierDocumentDto.prototype, "fileHash", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateSupplierDocumentDto.prototype, "issuedAt", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateSupplierDocumentDto.prototype, "expiresAt", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], CreateSupplierDocumentDto.prototype, "uploadedById", void 0);
export class OpenVerificationCaseDto {
    companyProfileId;
    caseNumber;
    verificationType;
    openedById;
    expiresAt;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], OpenVerificationCaseDto.prototype, "companyProfileId", void 0);
__decorate([
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], OpenVerificationCaseDto.prototype, "caseNumber", void 0);
__decorate([
    IsOptional(),
    IsIn(['initial', 'periodic', 'renewal', 're_verification']),
    __metadata("design:type", String)
], OpenVerificationCaseDto.prototype, "verificationType", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], OpenVerificationCaseDto.prototype, "openedById", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], OpenVerificationCaseDto.prototype, "expiresAt", void 0);
export class UpdateVerificationCaseDto {
    status;
}
__decorate([
    IsOptional(),
    IsIn(['open', 'in_progress', 'approved', 'rejected', 'expired', 'cancelled']),
    __metadata("design:type", String)
], UpdateVerificationCaseDto.prototype, "status", void 0);
export class CreateRiskAssessmentDto {
    verificationCaseId;
    riskLevel;
    riskScore;
    rationale;
    assessedById;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateRiskAssessmentDto.prototype, "verificationCaseId", void 0);
__decorate([
    IsIn(['low', 'medium', 'high', 'critical']),
    __metadata("design:type", String)
], CreateRiskAssessmentDto.prototype, "riskLevel", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    Max(100),
    __metadata("design:type", Number)
], CreateRiskAssessmentDto.prototype, "riskScore", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateRiskAssessmentDto.prototype, "rationale", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateRiskAssessmentDto.prototype, "assessedById", void 0);
//# sourceMappingURL=vendor.dto.js.map