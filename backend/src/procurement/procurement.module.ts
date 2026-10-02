import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalsController } from './controllers/approvals.controller.js';
import { ProcurementController } from './controllers/procurement.controller.js';
import { RequisitionsController } from './controllers/requisitions.controller.js';
import { Approval } from './entities/approval.entity.js';
import { GoodsReceiptItem } from './entities/goods-receipt-item.entity.js';
import { GoodsReceipt } from './entities/goods-receipt.entity.js';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity.js';
import { PurchaseOrder } from './entities/purchase-order.entity.js';
import { RequisitionItem } from './entities/requisition-item.entity.js';
import { Requisition } from './entities/requisition.entity.js';
import { ApprovalsService } from './providers/approvals.service.js';
import { ProcurementService } from './providers/procurement.service.js';
import { RequisitionsService } from './providers/requisitions.service.js';

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
  controllers: [
    RequisitionsController,
    ApprovalsController,
    ProcurementController,
  ],
  providers: [RequisitionsService, ApprovalsService, ProcurementService],
  exports: [
    TypeOrmModule,
    RequisitionsService,
    ApprovalsService,
    ProcurementService,
  ],
})
export class ProcurementModule {}
