var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GoodsReceiptItem } from '../entities/goods-receipt-item.entity.js';
import { GoodsReceipt } from '../entities/goods-receipt.entity.js';
import { PurchaseOrderItem } from '../entities/purchase-order-item.entity.js';
import { PurchaseOrder } from '../entities/purchase-order.entity.js';
let ProcurementService = class ProcurementService {
    purchaseOrders;
    dataSource;
    constructor(purchaseOrders, dataSource) {
        this.purchaseOrders = purchaseOrders;
        this.dataSource = dataSource;
    }
    findOrders(companyId) {
        return this.purchaseOrders.find({
            where: { company: { id: companyId } },
            relations: { supplier: true, buyer: true, requisition: true },
            order: { createdAt: 'DESC' },
        });
    }
    async findOrder(id) {
        const order = await this.purchaseOrders.findOne({
            where: { id },
            relations: { supplier: true, buyer: true, requisition: true },
        });
        if (!order)
            throw new NotFoundException(`PurchaseOrder ${id} not found`);
        return order;
    }
    orderItems(id) {
        return this.dataSource.getRepository(PurchaseOrderItem).find({
            where: { purchaseOrder: { id } },
            relations: { item: true, unitOfMeasure: true },
        });
    }
    createOrder(dto) {
        const { companyId, requisitionId, supplierId, buyerId, items, ...rest } = dto;
        return this.dataSource.transaction(async (manager) => {
            const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantityOrdered, 0);
            const order = await manager.save(manager.create(PurchaseOrder, {
                ...rest,
                totalAmount,
                company: { id: companyId },
                requisition: { id: requisitionId },
                supplier: { id: supplierId },
                buyer: { id: buyerId },
            }));
            await manager.save(items.map((item) => manager.create(PurchaseOrderItem, {
                ...item,
                lineTotal: item.unitPrice * item.quantityOrdered,
                purchaseOrder: { id: order.id },
                requisitionItem: item.requisitionItemId
                    ? { id: item.requisitionItemId }
                    : undefined,
                item: { id: item.itemId },
                unitOfMeasure: { id: item.unitOfMeasureId },
            })));
            return order;
        });
    }
    async updateOrder(id, dto) {
        const order = await this.findOrder(id);
        Object.assign(order, dto);
        return this.purchaseOrders.save(order);
    }
    createReceipt(dto) {
        const { purchaseOrderId, receivedById, items, ...rest } = dto;
        return this.dataSource.transaction(async (manager) => {
            const receipt = await manager.save(manager.create(GoodsReceipt, {
                ...rest,
                purchaseOrder: { id: purchaseOrderId },
                receivedBy: { id: receivedById },
            }));
            await manager.save(items.map((item) => manager.create(GoodsReceiptItem, {
                ...item,
                goodsReceipt: { id: receipt.id },
                purchaseOrderItem: { id: item.purchaseOrderItemId },
            })));
            return receipt;
        });
    }
    receiptsForOrder(orderId) {
        return this.dataSource.getRepository(GoodsReceipt).find({
            where: { purchaseOrder: { id: orderId } },
            relations: { receivedBy: true },
        });
    }
};
ProcurementService = __decorate([
    Injectable(),
    __param(0, InjectRepository(PurchaseOrder)),
    __metadata("design:paramtypes", [Repository,
        DataSource])
], ProcurementService);
export { ProcurementService };
//# sourceMappingURL=procurement.service.js.map