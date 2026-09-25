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
import { Item } from '../../catalog/entities/item.entity.js';
import { UnitOfMeasure } from '../../catalog/entities/unit-of-measure.entity.js';
import { PurchaseOrder } from './purchase-order.entity.js';
import { RequisitionItem } from './requisition-item.entity.js';
let PurchaseOrderItem = class PurchaseOrderItem extends BaseEntity {
    purchaseOrder;
    requisitionItem;
    item;
    description;
    quantityOrdered;
    unitOfMeasure;
    unitPrice;
    lineTotal;
    deliveryDate;
    itemStatus;
};
__decorate([
    ManyToOne(() => PurchaseOrder, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'purchase_order_id' }),
    __metadata("design:type", PurchaseOrder)
], PurchaseOrderItem.prototype, "purchaseOrder", void 0);
__decorate([
    ManyToOne(() => RequisitionItem, { nullable: true }),
    JoinColumn({ name: 'requisition_item_id' }),
    __metadata("design:type", RequisitionItem)
], PurchaseOrderItem.prototype, "requisitionItem", void 0);
__decorate([
    ManyToOne(() => Item, { nullable: false }),
    JoinColumn({ name: 'item_id' }),
    __metadata("design:type", Item)
], PurchaseOrderItem.prototype, "item", void 0);
__decorate([
    Column({ type: 'varchar', length: 500, nullable: false }),
    __metadata("design:type", String)
], PurchaseOrderItem.prototype, "description", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 2, nullable: false }),
    __metadata("design:type", Number)
], PurchaseOrderItem.prototype, "quantityOrdered", void 0);
__decorate([
    ManyToOne(() => UnitOfMeasure, { nullable: false }),
    JoinColumn({ name: 'unit_of_measure_id' }),
    __metadata("design:type", UnitOfMeasure)
], PurchaseOrderItem.prototype, "unitOfMeasure", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 2, nullable: false }),
    __metadata("design:type", Number)
], PurchaseOrderItem.prototype, "unitPrice", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 2, nullable: false }),
    __metadata("design:type", Number)
], PurchaseOrderItem.prototype, "lineTotal", void 0);
__decorate([
    Column({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], PurchaseOrderItem.prototype, "deliveryDate", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, nullable: false, default: 'Open' }),
    __metadata("design:type", String)
], PurchaseOrderItem.prototype, "itemStatus", void 0);
PurchaseOrderItem = __decorate([
    Entity({ schema: 'procurement', name: 'purchase_order_items' }),
    Check(`quantity_ordered > 0`),
    Check(`unit_price >= 0`),
    Check(`line_total >= 0`)
], PurchaseOrderItem);
export { PurchaseOrderItem };
//# sourceMappingURL=purchase-order-item.entity.js.map