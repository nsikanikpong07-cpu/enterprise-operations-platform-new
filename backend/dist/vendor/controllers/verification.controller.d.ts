import { CreateRiskAssessmentDto, OpenVerificationCaseDto, UpdateVerificationCaseDto } from '../dto/vendor.dto.js';
import { VerificationService } from '../providers/verification.service.js';
export declare class VerificationController {
    private readonly verification;
    constructor(verification: VerificationService);
    openCase(dto: OpenVerificationCaseDto): Promise<import("../entities/verification-case.entity.js").VerificationCase>;
    casesForProfile(profileId: string): Promise<import("../entities/verification-case.entity.js").VerificationCase[]>;
    findCase(id: string): Promise<import("../entities/verification-case.entity.js").VerificationCase>;
    updateCase(id: string, dto: UpdateVerificationCaseDto): Promise<import("../entities/verification-case.entity.js").VerificationCase>;
    assess(dto: CreateRiskAssessmentDto): Promise<import("../entities/supplier-risk-assessment.entity.js").SupplierRiskAssessment>;
    assessmentsForCase(id: string): Promise<import("../entities/supplier-risk-assessment.entity.js").SupplierRiskAssessment[]>;
}
