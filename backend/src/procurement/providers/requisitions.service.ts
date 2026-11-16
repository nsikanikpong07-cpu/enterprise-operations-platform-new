import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import {
  CreateRequisitionDto,
  UpdateRequisitionDto,
} from '../dto/procurement.dto.js';
import { Approval } from '../entities/approval.entity.js';
import { RequisitionItem } from '../entities/requisition-item.entity.js';
import { Requisition } from '../entities/requisition.entity.js';

@Injectable()
export class RequisitionsService {
  constructor(
    @InjectRepository(Requisition)
    private readonly requisitions: Repository<Requisition>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(companyId: string): Promise<Requisition[]> {
    return this.requisitions.find({
      where: { company: { id: companyId } },
      relations: {
        requester: true,
        department: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Requisition> {
    const requisition = await this.requisitions.findOne({
      where: { id },
      relations: {
        requester: true,
        department: true,
      },
    });

    if (!requisition) {
      throw new NotFoundException(`Requisition ${id} not found`);
    }

    return requisition;
  }

  async itemsFor(id: string): Promise<RequisitionItem[]> {
    await this.findOne(id);

    return this.dataSource.getRepository(RequisitionItem).find({
      where: { requisition: { id } },
      relations: {
        item: true,
        unitOfMeasure: true,
      },
    });
  }

  create(dto: CreateRequisitionDto): Promise<Requisition> {
    const {
      companyId,
      requesterId,
      departmentId,
      items,
      ...rest
    } = dto;

    return this.dataSource.transaction(async (manager) => {
      const preparedItems = items.map(
        ({ id: _id, itemId, unitOfMeasureId, ...fields }) => ({
          ...fields,
          item: { id: itemId },
          unitOfMeasure: { id: unitOfMeasureId },
          estimatedTotalPrice:
            fields.estimatedUnitPrice != null
              ? Math.round(
                  fields.estimatedUnitPrice *
                    fields.quantityRequested *
                    100,
                ) / 100
              : undefined,
        }),
      );

      const allItemsPriced = preparedItems.every(
        (item) => item.estimatedTotalPrice != null,
      );

      const totalEstimatedAmount = allItemsPriced
        ? Math.round(
            preparedItems.reduce(
              (sum, item) => sum + (item.estimatedTotalPrice ?? 0),
              0,
            ) * 100,
          ) / 100
        : undefined;

      const requisition = await manager.save(
        manager.create(Requisition, {
          ...rest,
          company: { id: companyId },
          requester: { id: requesterId },
          department: departmentId
            ? { id: departmentId }
            : undefined,
          totalEstimatedAmount,
        }),
      );

      await manager.save(
        preparedItems.map((item) =>
          manager.create(RequisitionItem, {
            ...item,
            requisition: { id: requisition.id },
          }),
        ),
      );

      return requisition;
    }).catch((error: unknown) => {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505')
        throw new ConflictException('A requisition with this number already exists in your company.');
      throw error;
    });
  }

  async submit(id: string): Promise<Requisition> {
    return this.dataSource.transaction(async manager => {
      const repo = manager.getRepository(Requisition);
      const requisition = await repo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!requisition) throw new NotFoundException('Requisition not found');
      if (requisition.status !== 'Draft') throw new ConflictException('Only a draft requisition can be submitted');
      const items = await manager.getRepository(RequisitionItem).count({ where: { requisition: { id } } });
      if (!items) throw new ConflictException('Add at least one item before submitting');
      requisition.status = 'Submitted';
      requisition.approvalStatus = 'Pending';
      return repo.save(requisition);
    });
  }

  async cancel(id: string): Promise<Requisition> {
    return this.dataSource.transaction(async manager => {
      const repo = manager.getRepository(Requisition);
      const requisition = await repo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!requisition) throw new NotFoundException('Requisition not found');
      if (!['Draft', 'Submitted', 'Pending'].includes(requisition.status) || requisition.approvalStatus !== 'Pending')
        throw new ConflictException('Only a requisition that has not been finally decided can be cancelled');
      requisition.status = 'Cancelled';
      return repo.save(requisition);
    });
  }

  async update(
    id: string,
    dto: UpdateRequisitionDto,
  ): Promise<Requisition> {
    return this.dataSource.transaction(async manager => {
      const repository = manager.getRepository(Requisition);
      const requisition = await repository.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!requisition) throw new NotFoundException('Requisition not found');
      if (requisition.status !== 'Draft') throw new ConflictException('Only draft requisitions can be edited');
      const { items, departmentId, requiredDate, ...fields } = dto;
      const lineRepo = manager.getRepository(RequisitionItem);
      const existing = await lineRepo.find({ where: { requisition: { id } } });
      const existingIds = new Set(existing.map(line => line.id));
      const retainedIds = new Set<string>();
      for (const item of items) {
        if (item.id && (!existingIds.has(item.id) || retainedIds.has(item.id)))
          throw new BadRequestException('An item line does not belong to this requisition or was repeated');
        if (item.id) retainedIds.add(item.id);
      }
      const lines = items.map(({ itemId, unitOfMeasureId, ...fields }) => ({
        ...fields, item: { id: itemId }, unitOfMeasure: { id: unitOfMeasureId },
        estimatedTotalPrice: fields.estimatedUnitPrice != null ? Math.round(fields.estimatedUnitPrice * fields.quantityRequested * 100) / 100 : undefined,
      }));
      Object.assign(requisition, fields, {
        department: departmentId ? { id: departmentId } : null,
        requiredDate: requiredDate || null,
        totalEstimatedAmount: lines.every(line => line.estimatedTotalPrice != null)
          ? Math.round(lines.reduce((sum, line) => sum + (line.estimatedTotalPrice ?? 0), 0) * 100) / 100 : null,
      });
      const removed = existing.filter(line => !retainedIds.has(line.id));
      if (removed.length) await lineRepo.remove(removed);
      await lineRepo.save(lines.map(line => lineRepo.create({ ...line, requisition: { id } })));
      return repository.save(requisition);
    });
  }
}
