import { Repository } from 'typeorm';
import { CreateRiskAssessmentDto, OpenVerificationCaseDto, UpdateVerificationCaseDto } from '../dto/vendor.dto.js';
import { SupplierRiskAssessment } from '../entities/supplier-risk-assessment.entity.js';
import { VerificationCase } from '../entities/verification-case.entity.js';
export declare class VerificationService {
    private readonly cases;
    private readonly riskAssessments;
    constructor(cases: Repository<VerificationCase>, riskAssessments: Repository<SupplierRiskAssessment>);
    openCase(dto: OpenVerificationCaseDto): Promise<VerificationCase>;
    casesForProfile(profileId: string): Promise<VerificationCase[]>;
    findCase(id: string): Promise<VerificationCase>;
    updateCase(id: string, dto: UpdateVerificationCaseDto): Promise<VerificationCase>;
    assess(dto: CreateRiskAssessmentDto): Promise<SupplierRiskAssessment>;
    assessmentsForCase(caseId: string): Promise<SupplierRiskAssessment[]>;
}
