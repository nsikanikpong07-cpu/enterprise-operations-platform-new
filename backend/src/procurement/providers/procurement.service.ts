import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

  // Return only suppliers with a current platform approval. A null expiry means no expiry was supplied.
  eligibleSuppliers(companyId: string): Promise<Array<{id: string; name: string}>> {
    return this.dataSource.query(`SELECT p.id, COALESCE(s.trading_name, s.legal_name) AS name FROM vendor.supplier_company_profiles p JOIN vendor.suppliers s ON s.id=p.supplier_id WHERE p.company_id=$1 AND EXISTS (SELECT 1 FROM vendor.verification_cases v WHERE COALESCE(v.supplier_id,(SELECT vp.supplier_id FROM vendor.supplier_company_profiles vp WHERE vp.id=v.supplier_company_profile_id))=p.supplier_id AND v.status='approved' AND (v.verified_by IS NOT NULL OR v.decision_source='ocr_match') AND (v.expires_at IS NULL OR v.expires_at > NOW()) AND NOT EXISTS (SELECT 1 FROM vendor.verification_cases newer LEFT JOIN vendor.supplier_company_profiles np ON np.id=newer.supplier_company_profile_id WHERE COALESCE(newer.supplier_id,np.supplier_id)=p.supplier_id AND (newer.opened_at, newer.id) > (v.opened_at, v.id))) ORDER BY name`, [companyId]);
  }

  // Purchase orders
  findOrders(companyId: string): Promise<PurchaseOrder[]> {
    return this.purchaseOrders.find({
      where: { company: { id: companyId } },
      relations: { supplier: { supplier: true }, buyer: { user: true }, requisition: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOrder(id: string): Promise<PurchaseOrder> {
    const order = await this.purchaseOrders.findOne({
      where: { id },
      relations: { supplier: { supplier: true }, buyer: { user: true }, requisition: true },
    });
    if (!order) throw new NotFoundException(`PurchaseOrder ${id} not found`);
    return order;
  }

  async orderItems(id: string): Promise<Array<PurchaseOrderItem & { quantityReceived: string }>> {
    const lines = await this.dataSource.getRepository(PurchaseOrderItem).find({
      where: { purchaseOrder: { id } },
      relations: { item: true, unitOfMeasure: true },
    });
    const totals: Array<{id: string; received: string}> = await this.dataSource.query(
      `SELECT poi.id, COALESCE(SUM(gri.quantity_received),0)::text AS received
       FROM procurement.purchase_order_items poi
       LEFT JOIN procurement.goods_receipt_items gri ON gri.purchase_order_item_id=poi.id
       WHERE poi.purchase_order_id=$1 GROUP BY poi.id`, [id],
    );
    const received = new Map(totals.map(total => [total.id, total.received]));
    return lines.map(line => ({ ...line, quantityReceived: received.get(line.id) ?? '0' }));
  }

  createOrder(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const { companyId, requisitionId, supplierId, buyerId, items, ...rest } =
      dto;
    return this.dataSource.transaction(async (manager) => {
      const requisitions = await manager.query(
        `SELECT id, currency FROM procurement.requisitions WHERE id=$1 AND company_id=$2 AND approval_status='Approved' AND status <> 'Cancelled' FOR UPDATE`,
        [requisitionId, companyId],
      );
      if (!requisitions.length) throw new BadRequestException('An approved requisition from this company is required');
      // Fail closed when no current approval can be established.
      const suppliers = await manager.query(
        `SELECT p.id FROM vendor.supplier_company_profiles p WHERE p.id=$1 AND p.company_id=$2 AND EXISTS (SELECT 1 FROM vendor.verification_cases v WHERE COALESCE(v.supplier_id,(SELECT vp.supplier_id FROM vendor.supplier_company_profiles vp WHERE vp.id=v.supplier_company_profile_id))=p.supplier_id AND v.status='approved' AND (v.verified_by IS NOT NULL OR v.decision_source='ocr_match') AND (v.expires_at IS NULL OR v.expires_at > NOW()) AND NOT EXISTS (SELECT 1 FROM vendor.verification_cases newer LEFT JOIN vendor.supplier_company_profiles np ON np.id=newer.supplier_company_profile_id WHERE COALESCE(newer.supplier_id,np.supplier_id)=p.supplier_id AND (newer.opened_at, newer.id) > (v.opened_at, v.id)))`,
        [supplierId, companyId],
      );
      if (!suppliers.length) throw new BadRequestException('Supplier verification must be approved and current');
      const buyers = await manager.query(
        `SELECT id FROM iam.company_users WHERE id=$1 AND company_id=$2 AND status='active'`,
        [buyerId, companyId],
      );
      if (!buyers.length) throw new BadRequestException('Buyer is unavailable');
      for (const item of items) {
        const products = await manager.query(
          `SELECT id FROM catalog.items WHERE id=$1 AND company_id=$2 AND is_active=true`,
          [item.itemId, companyId],
        );
        if (!products.length) throw new BadRequestException('Catalog item is unavailable');
        if (!Number.isInteger(item.quantityOrdered)) {
          const units = await manager.query('SELECT allows_fractional FROM catalog.units_of_measure WHERE id=$1', [item.unitOfMeasureId]);
          if (!units.length || units[0].allows_fractional !== true)
            throw new BadRequestException('This unit requires a whole-number quantity or has no fractional policy configured');
        }
        if (item.requisitionItemId) {
          const lines = await manager.query(
            `SELECT id FROM procurement.requisition_items WHERE id=$1 AND requisition_id=$2 AND item_id=$3`,
            [item.requisitionItemId, requisitionId, item.itemId],
          );
          if (!lines.length) throw new BadRequestException('Requisition item does not belong to this requisition or catalog item');
        }
      }
      const totalAmount = Math.round(items.reduce(
        (sum, item) => sum + Math.round(item.unitPrice * item.quantityOrdered * 100),
        0,
      )) / 100;
      const order = await manager.save(
        manager.create(PurchaseOrder, {
          ...rest,
          currency: rest.currency ?? requisitions[0].currency ?? 'NGN',
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
            lineTotal: Math.round(item.unitPrice * item.quantityOrdered * 100) / 100,
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
    }).catch((error: unknown) => {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505')
        throw new ConflictException('A purchase order with this number already exists.');
      throw error;
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

  async issueOrder(id: string): Promise<PurchaseOrder> {
    return this.dataSource.transaction(async manager => {
      const rows = await manager.query(`SELECT status, requisition_id, company_id, supplier_id FROM procurement.purchase_orders WHERE id=$1 FOR UPDATE`, [id]);
      if (!rows.length) throw new NotFoundException('Purchase order not found');
      const order = rows[0];
      if (!['Draft', 'Approved'].includes(order.status))
        throw new ConflictException('Only a draft or previously approved order can be marked issued');
      const requisitions = await manager.query(`SELECT id FROM procurement.requisitions WHERE id=$1 AND company_id=$2 AND approval_status='Approved' AND status <> 'Cancelled'`, [order.requisition_id, order.company_id]);
      if (!requisitions.length) throw new BadRequestException('An approved requisition from this company is required');
      const suppliers = await manager.query(`SELECT p.id FROM vendor.supplier_company_profiles p WHERE p.id=$1 AND p.company_id=$2 AND EXISTS (SELECT 1 FROM vendor.verification_cases v WHERE COALESCE(v.supplier_id,(SELECT vp.supplier_id FROM vendor.supplier_company_profiles vp WHERE vp.id=v.supplier_company_profile_id))=p.supplier_id AND v.status='approved' AND (v.verified_by IS NOT NULL OR v.decision_source='ocr_match') AND (v.expires_at IS NULL OR v.expires_at > NOW()) AND NOT EXISTS (SELECT 1 FROM vendor.verification_cases newer LEFT JOIN vendor.supplier_company_profiles np ON np.id=newer.supplier_company_profile_id WHERE COALESCE(newer.supplier_id,np.supplier_id)=p.supplier_id AND (newer.opened_at, newer.id) > (v.opened_at, v.id)))`, [order.supplier_id, order.company_id]);
      if (!suppliers.length) throw new BadRequestException('Supplier verification must be approved and current');
      const lines = await manager.getRepository(PurchaseOrderItem).count({ where: { purchaseOrder: { id } } });
      if (!lines) throw new BadRequestException('Add at least one item before marking the purchase order issued');
      const repository = manager.getRepository(PurchaseOrder);
      await repository.update({ id }, { status: 'Issued' });
      const saved = await repository.findOneBy({ id });
      if (!saved) throw new NotFoundException('Purchase order not found');
      return saved;
    });
  }

  // Goods receipts
  findReceipts(companyId: string): Promise<GoodsReceipt[]> {
    return this.dataSource.getRepository(GoodsReceipt).find({
      where: { purchaseOrder: { company: { id: companyId } } },
      relations: { purchaseOrder: true },
      order: { receiptDate: 'DESC' },
    });
  }

  async findReceipt(id: string): Promise<{ receipt: GoodsReceipt; items: GoodsReceiptItem[] }> {
    const receipt = await this.dataSource.getRepository(GoodsReceipt).findOne({
      where: { id }, relations: { purchaseOrder: true, receivedBy: { user: true } },
    });
    if (!receipt) throw new NotFoundException('Goods receipt not found');
    const items = await this.dataSource.getRepository(GoodsReceiptItem).find({
      where: { goodsReceipt: { id } }, relations: { purchaseOrderItem: { item: true, unitOfMeasure: true } },
    });
    return { receipt, items };
  }

  createReceipt(dto: CreateGoodsReceiptDto): Promise<GoodsReceipt> {
    const { purchaseOrderId, receivedById, items, ...rest } = dto;
    return this.dataSource.transaction(async (manager) => {
      // Lock the order so its status cannot change while a receipt is recorded.
      const orders = await manager.query('SELECT status FROM procurement.purchase_orders WHERE id=$1 FOR UPDATE', [purchaseOrderId]);
      if (!orders.length) throw new NotFoundException('Purchase order not found');
      if (orders[0].status !== 'Issued') throw new ConflictException('This purchase order must be issued before goods can be received');
      // Validate each line against this order before saving anything.
      const seen = new Set<string>();
      for (const item of items) {
        if (seen.has(item.purchaseOrderItemId))
          throw new BadRequestException('A purchase order line cannot be repeated in the same receipt');
        seen.add(item.purchaseOrderItemId);
        const line = await manager.findOne(PurchaseOrderItem, {
          where: { id: item.purchaseOrderItemId, purchaseOrder: { id: purchaseOrderId } },
        });
        if (!line) throw new BadRequestException('Receipt line does not belong to this purchase order');
        const received = item.quantityReceived;
        const accepted = item.quantityAccepted;
        const rejected = item.quantityRejected ?? 0;
        if (![received, accepted, rejected].every((n) => Number.isFinite(n) && n >= 0 && Number.isSafeInteger(Math.round(n * 100)) && Math.abs(n * 100 - Math.round(n * 100)) < 1e-7) || Math.round(accepted * 100) + Math.round(rejected * 100) > Math.round(received * 100))
          throw new BadRequestException('Accepted and rejected quantities cannot exceed the received quantity');
        if (rejected > 0 && !item.rejectionReason?.trim())
          throw new BadRequestException('A rejection reason is required when items are rejected');
        if (![received, accepted, rejected].every(Number.isInteger)) {
          const units = await manager.query(`SELECT u.allows_fractional FROM procurement.purchase_order_items poi JOIN catalog.units_of_measure u ON u.id=poi.unit_of_measure_id WHERE poi.id=$1`, [item.purchaseOrderItemId]);
          if (!units.length || units[0].allows_fractional !== true)
            throw new BadRequestException('This unit requires whole-number quantities or has no fractional policy configured');
        }
      }
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
    }).catch((error: unknown) => {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505')
        throw new ConflictException('A goods receipt with this number already exists.');
      throw error;
    });
  }

  receiptsForOrder(orderId: string): Promise<GoodsReceipt[]> {
    return this.dataSource.getRepository(GoodsReceipt).find({
      where: { purchaseOrder: { id: orderId } },
      relations: { receivedBy: true },
    });
  }
}
