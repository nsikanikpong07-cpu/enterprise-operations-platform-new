import { Check, Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity({ schema: 'vendor', name: 'suppliers' })
@Check(`status IN ('active', 'inactive', 'suspended')`)
export class Supplier extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  legalName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tradingName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  registrationNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  taxIdentificationNumber?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  supplierType?: string;

  @Column({ type: 'char', length: 2, nullable: true })
  countryCode?: string;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'active' })
  status!: string;
}
