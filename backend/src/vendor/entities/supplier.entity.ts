import { Check, Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity({ schema: 'vendor', name: 'suppliers' })
@Check(`status IN ('active', 'inactive', 'suspended')`)
export class Supplier extends BaseEntity {
  @Column({name: 'legal_name', type: 'varchar', length: 255, nullable: false })
  legalName!: string;

  @Column({name: 'trading_name', type: 'varchar', length: 255, nullable: true })
  tradingName?: string;

  @Column({name: 'registration_number', type: 'varchar', length: 100, nullable: true })
  registrationNumber?: string;

  @Column({name: 'tax_identification_number', type: 'varchar', length: 100, nullable: true })
  taxIdentificationNumber?: string;

  @Column({name: 'supplier_type', type: 'varchar', length: 50, nullable: true })
  supplierType?: string;

  @Column({name: 'country_code', type: 'char', length: 2, nullable: true })
  countryCode?: string;

  @Column({name: 'status', type: 'varchar', length: 30, nullable: false, default: 'active' })
  status!: string;
}
