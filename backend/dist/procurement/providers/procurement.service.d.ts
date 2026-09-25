import { DataSource, Repository } from 'typeorm';
import { CreateGoodsReceiptDto, CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from '../dto/procurement.dto.js';
import { GoodsReceipt } from '../entities/goods-receipt.entity.js';
import { PurchaseOrderItem } from '../entities/purchase-order-item.entity.js';
import { PurchaseOrder } from '../entities/purchase-order.entity.js';
export declare class ProcurementService {
    private readonly purchaseOrders;
    private readonly dataSource;
    constructor(purchaseOrders: Repository<PurchaseOrder>, dataSource: DataSource);
    findOrders(companyId: string): Promise<PurchaseOrder[]>;
    findOrder(id: string): Promise<PurchaseOrder>;
    orderItems(id: string): Promise<PurchaseOrderItem[]>;
    createOrder(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder>;
    updateOrder(id: string, dto: UpdatePurchaseOrderDto): Promise<PurchaseOrder>;
    createReceipt(dto: CreateGoodsReceiptDto): Promise<GoodsReceipt>;
    receiptsForOrder(orderId: string): Promise<GoodsReceipt[]>;
}
