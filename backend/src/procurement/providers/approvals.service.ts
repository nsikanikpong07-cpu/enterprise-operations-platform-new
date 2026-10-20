import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import {
  CreateApprovalDto,
  DecideApprovalDto,
} from '../dto/procurement.dto.js';
import { Approval } from '../entities/approval.entity.js';
import { Requisition } from '../entities/requisition.entity.js';
import { RequisitionItem } from '../entities/requisition-item.entity.js';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectRepository(Approval)
    private readonly approvals: Repository<Approval>,
    private readonly dataSource: DataSource,
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
      where: {
        approver: { id: approverId },
        approvalStatus: 'Pending',
      },
      relations: { requisition: true },
    });
  }

  async decide(id: string, dto: DecideApprovalDto): Promise<Approval> {
    return this.dataSource.transaction(async (manager) => {
      const approvalRepository = manager.getRepository(Approval);
      const requisitionRepository = manager.getRepository(Requisition);

      const initialApproval = await approvalRepository.findOne({
        where: { id },
        relations: { requisition: true },
      });

      if (!initialApproval) {
        throw new NotFoundException(`Approval ${id} not found`);
      }

      // Lock the parent so decisions for this requisition run in order.
      const requisition = await requisitionRepository.findOne({
        where: { id: initialApproval.requisition.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!requisition) {
        throw new NotFoundException('Requisition not found');
      }

      const approval = await approvalRepository.findOneBy({ id });

      if (!approval) {
        throw new NotFoundException(`Approval ${id} not found`);
      }

      if (
        approval.approvalStatus !== 'Pending' &&
        approval.approvalStatus !== dto.approvalStatus
      ) {
        throw new ConflictException(
          'This approval already has a different decision',
        );
      }

      // Repeating the same decision preserves its original date and comments.
      if (approval.approvalStatus === 'Pending') {
        approval.approvalStatus = dto.approvalStatus;
        approval.approvalDate = new Date();
        approval.comments = dto.comments;
        approval.rejectionReason =
          dto.approvalStatus === 'Rejected'
            ? dto.rejectionReason
            : undefined;

        await approvalRepository.save(approval);
      }

      const decisions = await approvalRepository.find({
        where: { requisition: { id: requisition.id } },
      });

      if (decisions.some((row) => row.approvalStatus === 'Rejected')) {
        requisition.approvalStatus = 'Rejected';
        requisition.status = 'Rejected';
      } else if (
        decisions.length > 0 &&
        decisions.every((row) => row.approvalStatus === 'Approved')
      ) {
        requisition.approvalStatus = 'Approved';
        requisition.status = 'Approved';
      } else {
        requisition.approvalStatus = 'Pending';
        requisition.status = 'Pending';
      }

      // Also repair the total on existing requisitions.
      const items = await manager.getRepository(RequisitionItem).find({
        where: { requisition: { id: requisition.id } },
      });

      if (
        items.length > 0 &&
        items.every((item) => item.estimatedTotalPrice != null)
      ) {
        requisition.totalEstimatedAmount =
          Math.round(
            items.reduce(
              (sum, item) => sum + Number(item.estimatedTotalPrice),
              0,
            ) * 100,
          ) / 100;
      }

      await requisitionRepository.save(requisition);

      return approval;
    });
  }
}