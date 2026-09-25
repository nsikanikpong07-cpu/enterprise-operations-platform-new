import { BaseEntity } from '../../common/entities/base.entity.js';
import { CompanyUser } from '../../iam/entities/company-user.entity.js';
import { PurchaseOrder } from './purchase-order.entity.js';
export declare class GoodsReceipt extends BaseEntity {
    receiptNumber: string;
    purchaseOrder: PurchaseOrder;
    receivedBy: CompanyUser;
    receiptDate: Date;
    deliveryNoteNumber?: string;
    receiptStatus: string;
    remarks?: string;
}
