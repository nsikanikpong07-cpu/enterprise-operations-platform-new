import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Item } from '../../catalog/entities/item.entity.js';
import { UnitOfMeasure } from '../../catalog/entities/unit-of-measure.entity.js';
import { Requisition } from './requisition.entity.js';

@Entity({ schema: 'procurement', name: 'requisition_items' })
@Check(`quantity_requested > 0`)
@Check(`estimated_unit_price IS NULL OR estimated_unit_price >= 0`)
@Check(`estimated_total_price IS NULL OR estimated_total_price >= 0`)
export class RequisitionItem extends BaseEntity {
  @ManyToOne(() => Requisition, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requisition_id' })
  requisition!: Requisition;

  @ManyToOne(() => Item, { nullable: false })
  @JoinColumn({ name: 'item_id' })
  item!: Item;

  @Column({ type: 'varchar', length: 500, nullable: false })
  description!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  quantityRequested!: number;

  @ManyToOne(() => UnitOfMeasure, { nullable: false })
  @JoinColumn({ name: 'unit_of_measure_id' })
  unitOfMeasure!: UnitOfMeasure;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  estimatedUnitPrice?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  estimatedTotalPrice?: number;

  @Column({ type: 'date', nullable: true })
  requiredDate?: Date;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'Pending' })
  itemStatus!: string;
}
