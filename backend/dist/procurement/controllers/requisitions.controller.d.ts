import { CreateRequisitionDto, UpdateRequisitionDto } from '../dto/procurement.dto.js';
import { RequisitionsService } from '../providers/requisitions.service.js';
export declare class RequisitionsController {
    private readonly requisitions;
    constructor(requisitions: RequisitionsService);
    findAll(companyId: string): Promise<import("../entities/requisition.entity.js").Requisition[]>;
    findOne(id: string): Promise<import("../entities/requisition.entity.js").Requisition>;
    itemsFor(id: string): Promise<import("../entities/requisition-item.entity.js").RequisitionItem[]>;
    create(dto: CreateRequisitionDto): Promise<import("../entities/requisition.entity.js").Requisition>;
    update(id: string, dto: UpdateRequisitionDto): Promise<import("../entities/requisition.entity.js").Requisition>;
}
