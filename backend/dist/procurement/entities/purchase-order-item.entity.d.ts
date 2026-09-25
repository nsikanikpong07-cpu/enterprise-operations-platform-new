import { BaseEntity } from '../../common/entities/base.entity.js';
import { Item } from '../../catalog/entities/item.entity.js';
import { UnitOfMeasure } from '../../catalog/entities/unit-of-measure.entity.js';
import { PurchaseOrder } from './purchase-order.entity.js';
import { RequisitionItem } from './requisition-item.entity.js';
export declare class PurchaseOrderItem extends BaseEntity {
    purchaseOrder: PurchaseOrder;
    requisitionItem?: RequisitionItem;
    item: Item;
    description: string;
    quantityOrdered: number;
    unitOfMeasure: UnitOfMeasure;
    unitPrice: number;
    lineTotal: number;
    deliveryDate?: Date;
    itemStatus: string;
}
