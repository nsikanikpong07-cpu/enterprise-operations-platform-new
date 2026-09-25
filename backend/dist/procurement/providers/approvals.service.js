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
import { Approval } from '../entities/approval.entity.js';
let ApprovalsService = class ApprovalsService {
    approvals;
    constructor(approvals) {
        this.approvals = approvals;
    }
    create(dto) {
        const { requisitionId, approverId, ...rest } = dto;
        return this.approvals.save(this.approvals.create({
            ...rest,
            requisition: { id: requisitionId },
            approver: { id: approverId },
        }));
    }
    forRequisition(requisitionId) {
        return this.approvals.find({
            where: { requisition: { id: requisitionId } },
            relations: { approver: true },
            order: { approvalLevel: 'ASC' },
        });
    }
    pendingFor(approverId) {
        return this.approvals.find({
            where: { approver: { id: approverId }, approvalStatus: 'Pending' },
            relations: { requisition: true },
        });
    }
    async decide(id, dto) {
        const approval = await this.approvals.findOneBy({ id });
        if (!approval)
            throw new NotFoundException(`Approval ${id} not found`);
        approval.approvalStatus = dto.approvalStatus;
        approval.approvalDate = new Date();
        approval.comments = dto.comments;
        approval.rejectionReason = dto.rejectionReason;
        return this.approvals.save(approval);
    }
};
ApprovalsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Approval)),
    __metadata("design:paramtypes", [Repository])
], ApprovalsService);
export { ApprovalsService };
//# sourceMappingURL=approvals.service.js.map