export declare class CreateSupplierDto {
    legalName: string;
    tradingName?: string;
    registrationNumber?: string;
    taxIdentificationNumber?: string;
    supplierType?: string;
    countryCode?: string;
}
export declare class UpdateSupplierDto {
    tradingName?: string;
    supplierType?: string;
    status?: string;
}
export declare class OnboardSupplierDto {
    supplierId: string;
    companyId: string;
    supplierCode?: string;
    notes?: string;
}
export declare class UpdateSupplierProfileDto {
    supplierCode?: string;
    relationshipStatus?: string;
    onboardingStatus?: string;
    notes?: string;
}
export declare class CreateSupplierContactDto {
    supplierId: string;
    name: string;
    email?: string;
    phone?: string;
    position?: string;
    isPrimary?: boolean;
}
export declare class CreateSupplierDocumentDto {
    supplierId: string;
    companyProfileId?: string;
    documentType: string;
    documentNumber?: string;
    fileUrl: string;
    fileHash?: string;
    issuedAt?: string;
    expiresAt?: string;
    uploadedById?: string;
}
export declare class OpenVerificationCaseDto {
    companyProfileId: string;
    caseNumber: string;
    verificationType?: string;
    openedById: string;
    expiresAt?: string;
}
export declare class UpdateVerificationCaseDto {
    status?: string;
}
export declare class CreateRiskAssessmentDto {
    verificationCaseId: string;
    riskLevel: string;
    riskScore?: number;
    rationale?: string;
    assessedById: string;
}
