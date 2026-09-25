var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { CompanyUser } from '../../iam/entities/company-user.entity.js';
import { PurchaseOrder } from './purchase-order.entity.js';
let GoodsReceipt = class GoodsReceipt extends BaseEntity {
    receiptNumber;
    purchaseOrder;
    receivedBy;
    receiptDate;
    deliveryNoteNumber;
    receiptStatus;
    remarks;
};
__decorate([
    Index({ unique: true }),
    Column({ type: 'varchar', length: 50, nullable: false, unique: true }),
    __metadata("design:type", String)
], GoodsReceipt.prototype, "receiptNumber", void 0);
__decorate([
    ManyToOne(() => PurchaseOrder, { nullable: false }),
    JoinColumn({ name: 'purchase_order_id' }),
    __metadata("design:type", PurchaseOrder)
], GoodsReceipt.prototype, "purchaseOrder", void 0);
__decorate([
    ManyToOne(() => CompanyUser, { nullable: false }),
    JoinColumn({ name: 'received_by' }),
    __metadata("design:type", CompanyUser)
], GoodsReceipt.prototype, "receivedBy", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: false, default: () => 'NOW()' }),
    __metadata("design:type", Date)
], GoodsReceipt.prototype, "receiptDate", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], GoodsReceipt.prototype, "deliveryNoteNumber", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, nullable: false, default: 'Pending' }),
    __metadata("design:type", String)
], GoodsReceipt.prototype, "receiptStatus", void 0);
__decorate([
    Column({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], GoodsReceipt.prototype, "remarks", void 0);
GoodsReceipt = __decorate([
    Entity({ schema: 'procurement', name: 'goods_receipts' }),
    Check(`receipt_status IN ('Pending', 'Partially Received', 'Completed')`)
], GoodsReceipt);
export { GoodsReceipt };
//# sourceMappingURL=goods-receipt.entity.js.map