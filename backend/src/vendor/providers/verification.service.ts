import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateRiskAssessmentDto,
  OpenVerificationCaseDto,
  UpdateVerificationCaseDto,
} from '../dto/vendor.dto.js';
import { SupplierRiskAssessment } from '../entities/supplier-risk-assessment.entity.js';
import { SupplierDocument } from '../entities/supplier-document.entity.js';
import { VerificationCheck } from '../entities/verification-check.entity.js';
import { VerificationCase } from '../entities/verification-case.entity.js';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationCase)
    private readonly cases: Repository<VerificationCase>,
    @InjectRepository(SupplierRiskAssessment)
    private readonly riskAssessments: Repository<SupplierRiskAssessment>,
    @InjectRepository(SupplierDocument)
    private readonly supplierDocuments: Repository<SupplierDocument>,
    @InjectRepository(VerificationCheck)
    private readonly checks: Repository<VerificationCheck>,
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

  async queueCases() {
    return this.cases.find({
      where: [{ status: 'open' }, { status: 'in_progress' }],
      relations: { openedBy: true, supplier: true, assignedReviewer: true },
      order: { openedAt: 'ASC', id: 'ASC' },
    });
  }

  async takeCase(id: string, reviewerId: string) {
    const result = await this.cases.createQueryBuilder()
      .update(VerificationCase)
      .set({ status: 'in_progress', assignedReviewer: { id: reviewerId } })
      .where('id = :id AND status = :status AND assigned_reviewer_id IS NULL', { id, status: 'open' })
      .execute();
    if (!result.affected) {
      const existing = await this.findCase(id);
      if (existing.status === 'in_progress' && existing.assignedReviewer?.id === reviewerId) return existing;
      if (existing.status === 'open') throw new ConflictException('Another reviewer has already taken this case.');
      throw new ConflictException('This case is no longer waiting for review.');
    }
    return this.findCase(id);
  }

  async findCase(id: string): Promise<VerificationCase> {
    const vCase = await this.cases.findOne({
      where: { id },
      relations: { openedBy: true, companyProfile: { supplier: true }, supplier: true, assignedReviewer: true },
    });
    if (!vCase)
      throw new NotFoundException(`VerificationCase ${id} not found`);
    return vCase;
  }

  async updateCase(
    id: string,
    dto: UpdateVerificationCaseDto,
    reviewerId: string,
  ): Promise<VerificationCase> {
    const vCase = await this.findCase(id);
    if (!vCase.assignedReviewer)
      throw new ConflictException('Take this case from the verification queue before deciding it.');
    if (vCase.assignedReviewer.id !== reviewerId)
      throw new ForbiddenException('Only the reviewer assigned to this case can decide it.');
    if (dto.status === 'approved' && vCase.expiresAt && new Date(vCase.expiresAt).getTime() <= Date.now())
      throw new BadRequestException('The verification expiry date must be in the future.');
    Object.assign(vCase, dto);
    if (dto.status) {
      vCase.verifiedById = dto.status === 'approved' ? reviewerId : null;
      vCase.decisionSource = 'manual';
    }
    if (dto.status && ['approved', 'rejected'].includes(dto.status))
      vCase.completedAt = new Date();
    const saved = await this.cases.save(vCase);
    if (dto.status === 'approved' || dto.status === 'rejected') {
      await this.checks.update(
        { verificationCase: { id } },
        {
          status: dto.status === 'approved' ? 'passed' : 'failed',
          checkedBy: { id: reviewerId },
          checkedAt: new Date(),
        },
      );
      const supplierId = vCase.supplier?.id ?? vCase.companyProfile?.supplier?.id;
      if (supplierId) await this.supplierDocuments.update(
        { supplier: { id: supplierId }, documentType: 'CAC registration certificate' },
        { status: dto.status === 'approved' ? 'valid' : 'rejected' },
      );
    }
    return saved;
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
