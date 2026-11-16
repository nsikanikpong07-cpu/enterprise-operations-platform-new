import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Supplier } from './supplier.entity.js';

@Entity({ schema: 'vendor', name: 'supplier_listings' })
@Check(`listing_type IN ('product', 'service')`)
@Check(`pricing_model IN ('fixed', 'price_on_request')`)
@Check(`status IN ('draft', 'active', 'unpublished', 'deleted')`)
export class SupplierListing extends BaseEntity {
  @ManyToOne(() => Supplier, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @Column({ name: 'listing_type', type: 'varchar', length: 20 })
  listingType!: 'product' | 'service';

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 150 })
  category!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'pricing_model', type: 'varchar', length: 30, default: 'fixed' })
  pricingModel!: 'fixed' | 'price_on_request';

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  price?: string | null;

  @Column({ type: 'char', length: 3, default: 'NGN' })
  currency!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  unit?: string | null;

  @Column({ type: 'text', nullable: true })
  specifications?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dimensions?: string | null;

  @Column({ name: 'service_area', type: 'varchar', length: 255, nullable: true })
  serviceArea?: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  photos!: string[];

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status!: 'draft' | 'active' | 'unpublished' | 'deleted';

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}
