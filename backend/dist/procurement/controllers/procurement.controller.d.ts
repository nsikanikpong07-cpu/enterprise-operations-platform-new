import { CreateGoodsReceiptDto, CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from '../dto/procurement.dto.js';
import { ProcurementService } from '../providers/procurement.service.js';
export declare class ProcurementController {
    private readonly procurement;
    constructor(procurement: ProcurementService);
    findOrders(companyId: string): Promise<import("../entities/purchase-order.entity.js").PurchaseOrder[]>;
    findOrder(id: string): Promise<import("../entities/purchase-order.entity.js").PurchaseOrder>;
    orderItems(id: string): Promise<import("../entities/purchase-order-item.entity.js").PurchaseOrderItem[]>;
    createOrder(dto: CreatePurchaseOrderDto): Promise<import("../entities/purchase-order.entity.js").PurchaseOrder>;
    updateOrder(id: string, dto: UpdatePurchaseOrderDto): Promise<import("../entities/purchase-order.entity.js").PurchaseOrder>;
    createReceipt(dto: CreateGoodsReceiptDto): Promise<import("../entities/goods-receipt.entity.js").GoodsReceipt>;
    receiptsForOrder(id: string): Promise<import("../entities/goods-receipt.entity.js").GoodsReceipt[]>;
}
