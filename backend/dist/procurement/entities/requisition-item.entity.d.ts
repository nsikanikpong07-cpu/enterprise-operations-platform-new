import { BaseEntity } from '../../common/entities/base.entity.js';
import { Item } from '../../catalog/entities/item.entity.js';
import { UnitOfMeasure } from '../../catalog/entities/unit-of-measure.entity.js';
import { Requisition } from './requisition.entity.js';
export declare class RequisitionItem extends BaseEntity {
    requisition: Requisition;
    item: Item;
    description: string;
    quantityRequested: number;
    unitOfMeasure: UnitOfMeasure;
    estimatedUnitPrice?: number;
    estimatedTotalPrice?: number;
    requiredDate?: Date;
    itemStatus: string;
}
