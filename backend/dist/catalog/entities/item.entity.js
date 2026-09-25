var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique, } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';
import { ItemCategory } from './item-category.entity.js';
import { UnitOfMeasure } from './unit-of-measure.entity.js';
let Item = class Item extends BaseEntity {
    company;
    category;
    unitOfMeasure;
    sku;
    name;
    description;
    itemType;
    isStockable;
    isActive;
};
__decorate([
    ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'company_id' }),
    __metadata("design:type", Company)
], Item.prototype, "company", void 0);
__decorate([
    ManyToOne(() => ItemCategory, {
        nullable: true,
        onDelete: 'SET NULL',
    }),
    JoinColumn({ name: 'category_id' }),
    __metadata("design:type", ItemCategory)
], Item.prototype, "category", void 0);
__decorate([
    ManyToOne(() => UnitOfMeasure, { nullable: false }),
    JoinColumn({ name: 'unit_of_measure_id' }),
    __metadata("design:type", UnitOfMeasure)
], Item.prototype, "unitOfMeasure", void 0);
__decorate([
    Index(),
    Column({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Item.prototype, "sku", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: false }),
    __metadata("design:type", String)
], Item.prototype, "name", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Item.prototype, "description", void 0);
__decorate([
    Column({ type: 'varchar', length: 30, nullable: false, default: 'material' }),
    __metadata("design:type", String)
], Item.prototype, "itemType", void 0);
__decorate([
    Column({ type: 'boolean', nullable: false, default: true }),
    __metadata("design:type", Boolean)
], Item.prototype, "isStockable", void 0);
__decorate([
    Column({ type: 'boolean', nullable: false, default: true }),
    __metadata("design:type", Boolean)
], Item.prototype, "isActive", void 0);
Item = __decorate([
    Entity({ schema: 'catalog', name: 'items' }),
    Unique(['company', 'sku']),
    Check(`item_type IN ('material', 'service', 'asset')`)
], Item);
export { Item };
//# sourceMappingURL=item.entity.js.map