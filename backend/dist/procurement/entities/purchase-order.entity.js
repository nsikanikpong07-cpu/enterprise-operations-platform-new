var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';
import { CompanyUser } from '../../iam/entities/company-user.entity.js';
import { SupplierCompanyProfile } from '../../vendor/entities/supplier-company-profile.entity.js';
import { Requisition } from './requisition.entity.js';
let PurchaseOrder = class PurchaseOrder extends BaseEntity {
    company;
    poNumber;
    requisition;
    supplier;
    buyer;
    orderDate;
    expectedDeliveryDate;
    currency;
    totalAmount;
    status;
    paymentTerms;
};
__decorate([
    ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'company_id' }),
    __metadata("design:type", Company)
], PurchaseOrder.prototype, "company", void 0);
__decorate([
    Index({ unique: true }),
    Column({ type: 'varchar', length: 50, nullable: false, unique: true }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "poNumber", void 0);
__decorate([
    ManyToOne(() => Requisition, { nullable: false }),
    JoinColumn({ name: 'requisition_id' }),
    __metadata("design:type", Requisition)
], PurchaseOrder.prototype, "requisition", void 0);
__decorate([
    ManyToOne(() => SupplierCompanyProfile, { nullable: false }),
    JoinColumn({ name: 'supplier_id' }),
    __metadata("design:type", SupplierCompanyProfile)
], PurchaseOrder.prototype, "supplier", void 0);
__decorate([
    ManyToOne(() => CompanyUser, { nullable: false }),
    JoinColumn({ name: 'buyer_id' }),
    __metadata("design:type", CompanyUser)
], PurchaseOrder.prototype, "buyer", void 0);
__decorate([
    Column({ type: 'date', nullable: false, default: () => 'CURRENT_DATE' }),
    __metadata("design:type", Date)
], PurchaseOrder.prototype, "orderDate", void 0);
__decorate([
    Column({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], PurchaseOrder.prototype, "expectedDeliveryDate", void 0);
__decorate([
    Column({ type: 'char', length: 3, nullable: false, default: 'NGN' }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "currency", void 0);
__decorate([
    Column({ type: 'decimal', precision: 15, scale: 2, nullable: false, default: 0 }),
    __metadata("design:type", Number)
], PurchaseOrder.prototype, "totalAmount", void 0);
__decorate([
    Index(),
    Column({ type: 'varchar', length: 30, nullable: false, default: 'Issued' }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "status", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "paymentTerms", void 0);
PurchaseOrder = __decorate([
    Entity({ schema: 'procurement', name: 'purchase_orders' }),
    Unique(['company', 'poNumber']),
    Check(`status IN ('Draft', 'Submitted', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed')`),
    Check(`total_amount >= 0`)
], PurchaseOrder);
export { PurchaseOrder };
//# sourceMappingURL=purchase-order.entity.js.map