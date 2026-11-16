import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { ApprovalsController } from './controllers/approvals.controller.js';
import { ProcurementController } from './controllers/procurement.controller.js';
import { RequisitionsController } from './controllers/requisitions.controller.js';
import { RfqsController } from './controllers/rfqs.controller.js';
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
import { RfqsService } from './providers/rfqs.service.js';
import { RfqNotificationsService } from './providers/rfq-notifications.service.js';
import { IamModule } from '../iam/iam.module.js';
@Module({
  imports: [
    AuthModule,
    IamModule,
    ConfigModule,
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
    RfqsController,
    ApprovalsController,
    ProcurementController,
  ],
  providers: [
    RequisitionsService,
    ApprovalsService,
    ProcurementService,
    RfqsService,
    RfqNotificationsService,
  ],
  exports: [
    TypeOrmModule,
    RequisitionsService,
    ApprovalsService,
    ProcurementService,
    RfqsService,
  ],
})
export class ProcurementModule {}
