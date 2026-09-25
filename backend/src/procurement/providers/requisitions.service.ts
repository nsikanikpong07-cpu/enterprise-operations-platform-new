import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  CreateRequisitionDto,
  UpdateRequisitionDto,
} from '../dto/procurement.dto.js';
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
      relations: { requester: true, department: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Requisition> {
    const requisition = await this.requisitions.findOne({
      where: { id },
      relations: { requester: true, department: true },
    });
    if (!requisition)
      throw new NotFoundException(`Requisition ${id} not found`);
    return requisition;
  }

  itemsFor(id: string): Promise<RequisitionItem[]> {
    return this.dataSource.getRepository(RequisitionItem).find({
      where: { requisition: { id } },
      relations: { item: true, unitOfMeasure: true },
    });
  }

  create(dto: CreateRequisitionDto): Promise<Requisition> {
    const { companyId, requesterId, departmentId, items, ...rest } = dto;
    return this.dataSource.transaction(async (manager) => {
      const requisition = await manager.save(
        manager.create(Requisition, {
          ...rest,
          company: { id: companyId },
          requester: { id: requesterId },
          department: departmentId ? { id: departmentId } : undefined,
        }),
      );
      await manager.save(
        items.map((item) =>
          manager.create(RequisitionItem, {
            ...item,
            requisition: { id: requisition.id },
            item: { id: item.itemId },
            unitOfMeasure: { id: item.unitOfMeasureId },
            estimatedTotalPrice:
              item.estimatedUnitPrice != null
                ? item.estimatedUnitPrice * item.quantityRequested
                : undefined,
          }),
        ),
      );
      return requisition;
    });
  }

  async update(id: string, dto: UpdateRequisitionDto): Promise<Requisition> {
    const requisition = await this.findOne(id);
    Object.assign(requisition, dto);
    return this.requisitions.save(requisition);
  }
}
