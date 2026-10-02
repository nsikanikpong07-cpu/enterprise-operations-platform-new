import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Supplier } from './supplier.entity.js';

@Entity({ schema: 'vendor', name: 'supplier_contacts' })
export class SupplierContact extends BaseEntity {
  @ManyToOne(() => Supplier, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @Column({ type: 'varchar', length: 200, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  position?: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  isPrimary!: boolean;
}
