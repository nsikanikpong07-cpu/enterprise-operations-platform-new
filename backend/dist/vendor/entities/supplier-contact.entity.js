var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Supplier } from './supplier.entity.js';
let SupplierContact = class SupplierContact extends BaseEntity {
    supplier;
    name;
    email;
    phone;
    position;
    isPrimary;
};
__decorate([
    ManyToOne(() => Supplier, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'supplier_id' }),
    __metadata("design:type", Supplier)
], SupplierContact.prototype, "supplier", void 0);
__decorate([
    Column({ type: 'varchar', length: 200, nullable: false }),
    __metadata("design:type", String)
], SupplierContact.prototype, "name", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], SupplierContact.prototype, "email", void 0);
__decorate([
    Column({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], SupplierContact.prototype, "phone", void 0);
__decorate([
    Column({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", String)
], SupplierContact.prototype, "position", void 0);
__decorate([
    Column({ type: 'boolean', nullable: false, default: false }),
    __metadata("design:type", Boolean)
], SupplierContact.prototype, "isPrimary", void 0);
SupplierContact = __decorate([
    Entity({ schema: 'vendor', name: 'supplier_contacts' })
], SupplierContact);
export { SupplierContact };
//# sourceMappingURL=supplier-contact.entity.js.map