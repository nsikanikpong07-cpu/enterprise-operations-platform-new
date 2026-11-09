import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { GoodsReceipt } from './goods-receipt.entity.js';
import { PurchaseOrderItem } from './purchase-order-item.entity.js';

@Entity({ schema: 'procurement', name: 'goods_receipt_items' })
@Check(`quantity_received >= 0`)
@Check(`quantity_accepted >= 0 AND quantity_accepted <= quantity_received`)
@Check(`quantity_rejected >= 0 AND quantity_rejected <= quantity_received`)
@Check(`quantity_accepted + quantity_rejected <= quantity_received`)
export class GoodsReceiptItem extends BaseEntity {
  @ManyToOne(() => GoodsReceipt, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goods_receipt_id' })
  goodsReceipt!: GoodsReceipt;

  @ManyToOne(() => PurchaseOrderItem, { nullable: false })
  @JoinColumn({ name: 'purchase_order_item_id' })
  purchaseOrderItem!: PurchaseOrderItem;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  quantityReceived!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  quantityAccepted!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false, default: 0 })
  quantityRejected!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  rejectionReason?: string;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'Good' })
  conditionStatus!: string;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'Pending' })
  inspectionStatus!: string;

  @Column({ type: 'timestamptz', nullable: false, default: () => 'NOW()' })
  receivedDate!: Date;
}
