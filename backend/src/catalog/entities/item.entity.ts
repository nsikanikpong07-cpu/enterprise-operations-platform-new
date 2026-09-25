import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';
import { ItemCategory } from './item-category.entity.js';
import { UnitOfMeasure } from './unit-of-measure.entity.js';

@Entity({ schema: 'catalog', name: 'items' })
@Unique(['company', 'sku'])
@Check(`item_type IN ('material', 'service', 'asset')`)
export class Item extends BaseEntity {
  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @ManyToOne(() => ItemCategory, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category?: ItemCategory;

  @ManyToOne(() => UnitOfMeasure, { nullable: false })
  @JoinColumn({ name: 'unit_of_measure_id' })
  unitOfMeasure!: UnitOfMeasure;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  sku?: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'material' })
  itemType!: string;

  @Column({ type: 'boolean', nullable: false, default: true })
  isStockable!: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  isActive!: boolean;
}
