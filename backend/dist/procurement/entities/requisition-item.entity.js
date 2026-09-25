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
import { Requisition } from './requisition.entity.js';
let RequisitionItem = class RequisitionItem extends BaseEntity {
    requisition;
    item;
    description;
    quantityRequested;
    unitOfMeasure;
    estimatedUnitPrice;
    estimatedTotalPrice;
    requiredDate;
    itemStatus;
};
__decorate([
    ManyToOne(() => Requisition, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'requisition_id' }),
    __metadata("design:type", Requisition)
], RequisitionItem.prototype, "requisition", void 0);
__decorate([
    ManyToOne(() => Item, { nullable: false }),
    JoinColumn({ name: 'item_id' }),
    __metadata("design:type", Item)
], RequisitionItem.prototype, "item", void 0);
__decorate([
    Column({ type: 'varchar', length: 500, nullable: false }),
    __metadata("design:type", String)
], RequisitionItem.prototype, "description", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 2, nullable: false }),
    __metadata("design:type", Number)
], RequisitionItem.prototype, "quantityRequested", void 0);
__decorate([
    ManyToOne(() => UnitOfMeasure, { nullable: false }),
    JoinColumn({ name: 'unit_of_measure_id' }),
    __metadata("design:type", UnitOfMeasure)
], RequisitionItem.prototype, "unitOfMeasure", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RequisitionItem.prototype, "estimatedUnitPrice", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], RequisitionItem.prototype, "estimatedTotalPrice", void 0);
__decorate([
    Column({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], RequisitionItem.prototype, "requiredDate", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, nullable: false, default: 'Pending' }),
    __metadata("design:type", String)
], RequisitionItem.prototype, "itemStatus", void 0);
RequisitionItem = __decorate([
    Entity({ schema: 'procurement', name: 'requisition_items' }),
    Check(`quantity_requested > 0`),
    Check(`estimated_unit_price IS NULL OR estimated_unit_price >= 0`),
    Check(`estimated_total_price IS NULL OR estimated_total_price >= 0`)
], RequisitionItem);
export { RequisitionItem };
//# sourceMappingURL=requisition-item.entity.js.map