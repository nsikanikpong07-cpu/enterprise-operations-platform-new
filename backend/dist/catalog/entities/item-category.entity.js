var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';
let ItemCategory = class ItemCategory extends BaseEntity {
    company;
    parent;
    children;
    name;
    description;
};
__decorate([
    ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'company_id' }),
    __metadata("design:type", Company)
], ItemCategory.prototype, "company", void 0);
__decorate([
    ManyToOne(() => ItemCategory, (category) => category.children, {
        nullable: true,
        onDelete: 'SET NULL',
    }),
    JoinColumn({ name: 'parent_id' }),
    __metadata("design:type", ItemCategory)
], ItemCategory.prototype, "parent", void 0);
__decorate([
    OneToMany(() => ItemCategory, (category) => category.parent),
    __metadata("design:type", Array)
], ItemCategory.prototype, "children", void 0);
__decorate([
    Column({ type: 'varchar', length: 150, nullable: false }),
    __metadata("design:type", String)
], ItemCategory.prototype, "name", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ItemCategory.prototype, "description", void 0);
ItemCategory = __decorate([
    Entity({ schema: 'catalog', name: 'item_categories' }),
    Unique(['company', 'name'])
], ItemCategory);
export { ItemCategory };
//# sourceMappingURL=item-category.entity.js.map