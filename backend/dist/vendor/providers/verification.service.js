var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierRiskAssessment } from '../entities/supplier-risk-assessment.entity.js';
import { VerificationCase } from '../entities/verification-case.entity.js';
let VerificationService = class VerificationService {
    cases;
    riskAssessments;
    constructor(cases, riskAssessments) {
        this.cases = cases;
        this.riskAssessments = riskAssessments;
    }
    openCase(dto) {
        const { companyProfileId, openedById, ...rest } = dto;
        return this.cases.save(this.cases.create({
            ...rest,
            companyProfile: { id: companyProfileId },
            openedBy: { id: openedById },
        }));
    }
    casesForProfile(profileId) {
        return this.cases.find({
            where: { companyProfile: { id: profileId } },
            relations: { openedBy: true },
        });
    }
    async findCase(id) {
        const vCase = await this.cases.findOne({
            where: { id },
            relations: { openedBy: true, companyProfile: true },
        });
        if (!vCase)
            throw new NotFoundException(`VerificationCase ${id} not found`);
        return vCase;
    }
    async updateCase(id, dto) {
        const vCase = await this.findCase(id);
        Object.assign(vCase, dto);
        if (dto.status && ['approved', 'rejected'].includes(dto.status))
            vCase.completedAt = new Date();
        return this.cases.save(vCase);
    }
    assess(dto) {
        const { verificationCaseId, assessedById, ...rest } = dto;
        return this.riskAssessments.save(this.riskAssessments.create({
            ...rest,
            verificationCase: { id: verificationCaseId },
            assessedBy: { id: assessedById },
        }));
    }
    assessmentsForCase(caseId) {
        return this.riskAssessments.find({
            where: { verificationCase: { id: caseId } },
            relations: { assessedBy: true },
        });
    }
};
VerificationService = __decorate([
    Injectable(),
    __param(0, InjectRepository(VerificationCase)),
    __param(1, InjectRepository(SupplierRiskAssessment)),
    __metadata("design:paramtypes", [Repository,
        Repository])
], VerificationService);
export { VerificationService };
//# sourceMappingURL=verification.service.js.map