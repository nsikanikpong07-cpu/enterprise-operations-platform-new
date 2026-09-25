var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { GoodsReceipt } from './goods-receipt.entity.js';
import { PurchaseOrderItem } from './purchase-order-item.entity.js';
let GoodsReceiptItem = class GoodsReceiptItem extends BaseEntity {
    goodsReceipt;
    purchaseOrderItem;
    quantityReceived;
    quantityAccepted;
    quantityRejected;
    rejectionReason;
    conditionStatus;
    inspectionStatus;
    receivedDate;
};
__decorate([
    ManyToOne(() => GoodsReceipt, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'goods_receipt_id' }),
    __metadata("design:type", GoodsReceipt)
], GoodsReceiptItem.prototype, "goodsReceipt", void 0);
__decorate([
    ManyToOne(() => PurchaseOrderItem, { nullable: false }),
    JoinColumn({ name: 'purchase_order_item_id' }),
    __metadata("design:type", PurchaseOrderItem)
], GoodsReceiptItem.prototype, "purchaseOrderItem", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 2, nullable: false }),
    __metadata("design:type", Number)
], GoodsReceiptItem.prototype, "quantityReceived", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 2, nullable: false }),
    __metadata("design:type", Number)
], GoodsReceiptItem.prototype, "quantityAccepted", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 2, nullable: false, default: 0 }),
    __metadata("design:type", Number)
], GoodsReceiptItem.prototype, "quantityRejected", void 0);
__decorate([
    Column({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], GoodsReceiptItem.prototype, "rejectionReason", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, nullable: false, default: 'Good' }),
    __metadata("design:type", String)
], GoodsReceiptItem.prototype, "conditionStatus", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, nullable: false, default: 'Pending' }),
    __metadata("design:type", String)
], GoodsReceiptItem.prototype, "inspectionStatus", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: false, default: () => 'NOW()' }),
    __metadata("design:type", Date)
], GoodsReceiptItem.prototype, "receivedDate", void 0);
GoodsReceiptItem = __decorate([
    Entity({ schema: 'procurement', name: 'goods_receipt_items' }),
    Check(`quantity_received >= 0`),
    Check(`quantity_accepted >= 0 AND quantity_accepted <= quantity_received`),
    Check(`quantity_rejected >= 0 AND quantity_rejected <= quantity_received`),
    Check(`quantity_accepted + quantity_rejected <= quantity_received`)
], GoodsReceiptItem);
export { GoodsReceiptItem };
//# sourceMappingURL=goods-receipt-item.entity.js.map