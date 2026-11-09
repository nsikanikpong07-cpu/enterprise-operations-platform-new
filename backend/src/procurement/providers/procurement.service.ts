import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  CreateGoodsReceiptDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from '../dto/procurement.dto.js';
import { GoodsReceiptItem } from '../entities/goods-receipt-item.entity.js';
import { GoodsReceipt } from '../entities/goods-receipt.entity.js';
import { PurchaseOrderItem } from '../entities/purchase-order-item.entity.js';
import { PurchaseOrder } from '../entities/purchase-order.entity.js';

@Injectable()
export class ProcurementService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrders: Repository<PurchaseOrder>,
    private readonly dataSource: DataSource,
  ) {}

  // Purchase orders
  findOrders(companyId: string): Promise<PurchaseOrder[]> {
    return this.purchaseOrders.find({
      where: { company: { id: companyId } },
      relations: { supplier: true, buyer: true, requisition: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOrder(id: string): Promise<PurchaseOrder> {
    const order = await this.purchaseOrders.findOne({
      where: { id },
      relations: { supplier: true, buyer: true, requisition: true },
    });
    if (!order) throw new NotFoundException(`PurchaseOrder ${id} not found`);
    return order;
  }

  orderItems(id: string): Promise<PurchaseOrderItem[]> {
    return this.dataSource.getRepository(PurchaseOrderItem).find({
      where: { purchaseOrder: { id } },
      relations: { item: true, unitOfMeasure: true },
    });
  }

  createOrder(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const { companyId, requisitionId, supplierId, buyerId, items, ...rest } =
      dto;
    return this.dataSource.transaction(async (manager) => {
      const totalAmount = items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantityOrdered,
        0,
      );
      const order = await manager.save(
        manager.create(PurchaseOrder, {
          ...rest,
          totalAmount,
          company: { id: companyId },
          requisition: { id: requisitionId },
          supplier: { id: supplierId },
          buyer: { id: buyerId },
        }),
      );
      await manager.save(
        items.map((item) =>
          manager.create(PurchaseOrderItem, {
            ...item,
            lineTotal: item.unitPrice * item.quantityOrdered,
            purchaseOrder: { id: order.id },
            requisitionItem: item.requisitionItemId
              ? { id: item.requisitionItemId }
              : undefined,
            item: { id: item.itemId },
            unitOfMeasure: { id: item.unitOfMeasureId },
          }),
        ),
      );
      return order;
    });
  }

  async updateOrder(
    id: string,
    dto: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    const order = await this.findOrder(id);
    Object.assign(order, dto);
    return this.purchaseOrders.save(order);
  }

  // Goods receipts
  createReceipt(dto: CreateGoodsReceiptDto): Promise<GoodsReceipt> {
    const { purchaseOrderId, receivedById, items, ...rest } = dto;
    return this.dataSource.transaction(async (manager) => {
      const receipt = await manager.save(
        manager.create(GoodsReceipt, {
          ...rest,
          purchaseOrder: { id: purchaseOrderId },
          receivedBy: { id: receivedById },
        }),
      );
      await manager.save(
        items.map((item) =>
          manager.create(GoodsReceiptItem, {
            ...item,
            goodsReceipt: { id: receipt.id },
            purchaseOrderItem: { id: item.purchaseOrderItemId },
          }),
        ),
      );
      return receipt;
    });
  }

  receiptsForOrder(orderId: string): Promise<GoodsReceipt[]> {
    return this.dataSource.getRepository(GoodsReceipt).find({
      where: { purchaseOrder: { id: orderId } },
      relations: { receivedBy: true },
    });
  }
}
