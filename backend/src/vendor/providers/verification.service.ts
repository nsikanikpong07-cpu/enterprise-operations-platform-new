import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateRiskAssessmentDto,
  OpenVerificationCaseDto,
  UpdateVerificationCaseDto,
} from '../dto/vendor.dto.js';
import { SupplierRiskAssessment } from '../entities/supplier-risk-assessment.entity.js';
import { VerificationCase } from '../entities/verification-case.entity.js';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationCase)
    private readonly cases: Repository<VerificationCase>,
    @InjectRepository(SupplierRiskAssessment)
    private readonly riskAssessments: Repository<SupplierRiskAssessment>,
  ) {}

  openCase(dto: OpenVerificationCaseDto): Promise<VerificationCase> {
    const { companyProfileId, openedById, ...rest } = dto;
    return this.cases.save(
      this.cases.create({
        ...rest,
        companyProfile: { id: companyProfileId },
        openedBy: { id: openedById },
      }),
    );
  }

  casesForProfile(profileId: string): Promise<VerificationCase[]> {
    return this.cases.find({
      where: { companyProfile: { id: profileId } },
      relations: { openedBy: true },
    });
  }

  async findCase(id: string): Promise<VerificationCase> {
    const vCase = await this.cases.findOne({
      where: { id },
      relations: { openedBy: true, companyProfile: true },
    });
    if (!vCase)
      throw new NotFoundException(`VerificationCase ${id} not found`);
    return vCase;
  }

  async updateCase(
    id: string,
    dto: UpdateVerificationCaseDto,
  ): Promise<VerificationCase> {
    const vCase = await this.findCase(id);
    Object.assign(vCase, dto);
    if (dto.status && ['approved', 'rejected'].includes(dto.status))
      vCase.completedAt = new Date();
    return this.cases.save(vCase);
  }

  assess(dto: CreateRiskAssessmentDto): Promise<SupplierRiskAssessment> {
    const { verificationCaseId, assessedById, ...rest } = dto;
    return this.riskAssessments.save(
      this.riskAssessments.create({
        ...rest,
        verificationCase: { id: verificationCaseId },
        assessedBy: { id: assessedById },
      }),
    );
  }

  assessmentsForCase(caseId: string): Promise<SupplierRiskAssessment[]> {
    return this.riskAssessments.find({
      where: { verificationCase: { id: caseId } },
      relations: { assessedBy: true },
    });
  }
}
