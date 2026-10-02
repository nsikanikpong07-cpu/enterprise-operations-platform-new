import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateApprovalDto,
  DecideApprovalDto,
} from '../dto/procurement.dto.js';
import { Approval } from '../entities/approval.entity.js';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectRepository(Approval)
    private readonly approvals: Repository<Approval>,
  ) {}

  create(dto: CreateApprovalDto): Promise<Approval> {
    const { requisitionId, approverId, ...rest } = dto;
    return this.approvals.save(
      this.approvals.create({
        ...rest,
        requisition: { id: requisitionId },
        approver: { id: approverId },
      }),
    );
  }

  forRequisition(requisitionId: string): Promise<Approval[]> {
    return this.approvals.find({
      where: { requisition: { id: requisitionId } },
      relations: { approver: true },
      order: { approvalLevel: 'ASC' },
    });
  }

  pendingFor(approverId: string): Promise<Approval[]> {
    return this.approvals.find({
      where: { approver: { id: approverId }, approvalStatus: 'Pending' },
      relations: { requisition: true },
    });
  }

  async decide(id: string, dto: DecideApprovalDto): Promise<Approval> {
    const approval = await this.approvals.findOneBy({ id });
    if (!approval) throw new NotFoundException(`Approval ${id} not found`);
    approval.approvalStatus = dto.approvalStatus;
    approval.approvalDate = new Date();
    approval.comments = dto.comments;
    approval.rejectionReason = dto.rejectionReason;
    return this.approvals.save(approval);
  }
}
