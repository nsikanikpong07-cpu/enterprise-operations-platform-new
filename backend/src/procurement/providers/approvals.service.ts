import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

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

  async create(dto: CreateApprovalDto): Promise<Approval> {
    const { requisitionId, approverId, ...rest } = dto;
    return this.dataSource.transaction(async (manager) => {
      const requisition = await manager.getRepository(Requisition).findOne({
        where: { id: requisitionId }, lock: { mode: 'pessimistic_write' },
      });
      if (!requisition) throw new NotFoundException('Requisition not found');
      if (requisition.status !== 'Draft')
        throw new ConflictException('Approvers can only be assigned while the requisition is a draft');
      const repo = manager.getRepository(Approval);
      const existing = await repo.findOne({ where: { requisition: { id: requisitionId }, approvalLevel: dto.approvalLevel } });
      if (existing) throw new ConflictException('An approver is already assigned to this level');
      return repo.save(repo.create({ ...rest, requisition: { id: requisitionId }, approver: { id: approverId } }));
    });
  }

  forRequisition(requisitionId: string): Promise<Approval[]> {
    return this.approvals.find({
      where: { requisition: { id: requisitionId } },
      relations: { approver: { user: true } },
      order: { approvalLevel: 'ASC' },
    });
  }

  pendingFor(approverId: string): Promise<Approval[]> {
    return this.approvals.find({
      where: {
        approver: { id: approverId },
        approvalStatus: 'Pending',
        requisition: { status: In(['Submitted', 'Pending']) },
      },
      relations: { requisition: true },
    });
  }

  pendingForCompany(companyId: string, approverId: string): Promise<Requisition[]> {
    return this.dataSource.getRepository(Requisition).createQueryBuilder('r')
      .leftJoinAndSelect('r.requester', 'requester')
      .leftJoinAndSelect('requester.user', 'requesterUser')
      .where('r.company_id = :companyId', { companyId })
      .andWhere('r.requester_id <> :approverId', { approverId })
      .andWhere('r.status IN (:...statuses)', { statuses: ['Submitted', 'Pending'] })
      .andWhere('r.approval_status = :status', { status: 'Pending' })
      .orderBy('r.created_at', 'DESC')
      .getMany();
  }

  async decideRequisition(id: string, approverId: string, dto: DecideApprovalDto): Promise<Approval> {
    if (dto.approvalStatus === 'Rejected' && !dto.rejectionReason?.trim())
      throw new BadRequestException('A rejection reason is required');
    return this.dataSource.transaction(async (manager) => {
      const requisitions = manager.getRepository(Requisition);
      const rows = await manager.query('SELECT requester_id FROM procurement.requisitions WHERE id=$1 FOR UPDATE', [id]);
      const requisition = rows.length ? await requisitions.findOneBy({ id }) : null;
      if (!requisition) throw new NotFoundException('Requisition not found');
      if (rows[0].requester_id === approverId) throw new ConflictException('You cannot approve your own requisition');
      if (!['Submitted', 'Pending'].includes(requisition.status) || requisition.approvalStatus !== 'Pending')
        throw new ConflictException('This requisition is no longer awaiting approval');
      const approvals = manager.getRepository(Approval);
      const previous = await approvals.find({ where: { requisition: { id } }, order: { approvalLevel: 'DESC' } });
      const approval = await approvals.save(approvals.create({
        requisition: { id }, approver: { id: approverId }, approvalLevel: (previous[0]?.approvalLevel ?? 0) + 1,
        approvalStatus: dto.approvalStatus, approvalDate: new Date(), comments: dto.comments?.trim() || undefined,
        rejectionReason: dto.approvalStatus === 'Rejected' ? dto.rejectionReason?.trim() : undefined,
      }));
      requisition.approvalStatus = dto.approvalStatus;
      requisition.status = dto.approvalStatus;
      await requisitions.save(requisition);
      return approval;
    });
  }

  async decide(id: string, dto: DecideApprovalDto): Promise<Approval> {
    if (dto.approvalStatus === 'Rejected' && !dto.rejectionReason?.trim())
      throw new BadRequestException('A rejection reason is required');
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

      // A retry of the same decision must not rewrite a later requisition state.
      if (approval.approvalStatus === dto.approvalStatus) return approval;

      // Never decide a draft, cancelled or already finalized requisition.
      if (
        approval.approvalStatus === 'Pending' &&
        !['Submitted', 'Pending'].includes(requisition.status)
      ) {
        throw new ConflictException('This requisition is not awaiting approval');
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
