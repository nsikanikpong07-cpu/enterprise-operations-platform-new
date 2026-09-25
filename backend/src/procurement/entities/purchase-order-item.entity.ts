import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Item } from '../../catalog/entities/item.entity.js';
import { UnitOfMeasure } from '../../catalog/entities/unit-of-measure.entity.js';
import { PurchaseOrder } from './purchase-order.entity.js';
import { RequisitionItem } from './requisition-item.entity.js';

@Entity({ schema: 'procurement', name: 'purchase_order_items' })
@Check(`quantity_ordered > 0`)
@Check(`unit_price >= 0`)
@Check(`line_total >= 0`)
export class PurchaseOrderItem extends BaseEntity {
  @ManyToOne(() => PurchaseOrder, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder!: PurchaseOrder;

  @ManyToOne(() => RequisitionItem, { nullable: true })
  @JoinColumn({ name: 'requisition_item_id' })
  requisitionItem?: RequisitionItem;

  @ManyToOne(() => Item, { nullable: false })
  @JoinColumn({ name: 'item_id' })
  item!: Item;

  @Column({ type: 'varchar', length: 500, nullable: false })
  description!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  quantityOrdered!: number;

  @ManyToOne(() => UnitOfMeasure, { nullable: false })
  @JoinColumn({ name: 'unit_of_measure_id' })
  unitOfMeasure!: UnitOfMeasure;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  lineTotal!: number;

  @Column({ type: 'date', nullable: true })
  deliveryDate?: Date;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'Open' })
  itemStatus!: string;
}
