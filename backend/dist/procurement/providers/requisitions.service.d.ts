import { DataSource, Repository } from 'typeorm';
import { CreateRequisitionDto, UpdateRequisitionDto } from '../dto/procurement.dto.js';
import { RequisitionItem } from '../entities/requisition-item.entity.js';
import { Requisition } from '../entities/requisition.entity.js';
export declare class RequisitionsService {
    private readonly requisitions;
    private readonly dataSource;
    constructor(requisitions: Repository<Requisition>, dataSource: DataSource);
    findAll(companyId: string): Promise<Requisition[]>;
    findOne(id: string): Promise<Requisition>;
    itemsFor(id: string): Promise<RequisitionItem[]>;
    create(dto: CreateRequisitionDto): Promise<Requisition>;
    update(id: string, dto: UpdateRequisitionDto): Promise<Requisition>;
}
