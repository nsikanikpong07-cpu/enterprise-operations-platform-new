import { BaseEntity } from '../../common/entities/base.entity.js';
import { GoodsReceipt } from './goods-receipt.entity.js';
import { PurchaseOrderItem } from './purchase-order-item.entity.js';
export declare class GoodsReceiptItem extends BaseEntity {
    goodsReceipt: GoodsReceipt;
    purchaseOrderItem: PurchaseOrderItem;
    quantityReceived: number;
    quantityAccepted: number;
    quantityRejected: number;
    rejectionReason?: string;
    conditionStatus: string;
    inspectionStatus: string;
    receivedDate: Date;
}
