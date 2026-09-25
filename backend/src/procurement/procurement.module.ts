import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Approval } from './entities/approval.entity.js';
import { GoodsReceiptItem } from './entities/goods-receipt-item.entity.js';
import { GoodsReceipt } from './entities/goods-receipt.entity.js';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity.js';
import { PurchaseOrder } from './entities/purchase-order.entity.js';
import { RequisitionItem } from './entities/requisition-item.entity.js';
import { Requisition } from './entities/requisition.entity.js';

@Module({
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
export class ProcurementModule {}
