var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Approval } from './entities/approval.entity.js';
import { GoodsReceiptItem } from './entities/goods-receipt-item.entity.js';
import { GoodsReceipt } from './entities/goods-receipt.entity.js';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity.js';
import { PurchaseOrder } from './entities/purchase-order.entity.js';
import { RequisitionItem } from './entities/requisition-item.entity.js';
import { Requisition } from './entities/requisition.entity.js';
let ProcurementModule = class ProcurementModule {
};
ProcurementModule = __decorate([
    Module({
        imports: [
            TypeOrmModule.forFeature([
                Requisition,
                RequisitionItem,
                Approval,
                PurchaseOrder,
                PurchaseOrderItem,
                GoodsReceipt,
                GoodsReceiptItem,
            ]),
        ],
        exports: [TypeOrmModule],
    })
], ProcurementModule);
export { ProcurementModule };
//# sourceMappingURL=procurement.module.js.map