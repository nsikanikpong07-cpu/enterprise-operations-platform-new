import { Check, Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity({ schema: 'organization', name: 'companies' })
@Check(`status IN ('active', 'suspended', 'inactive')`)
export class Company extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legalName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  registrationNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  taxIdentificationNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry?: string;

  @Column({ type: 'char', length: 2, nullable: false, default: 'NG' })
  countryCode!: string;

  @Column({ type: 'char', length: 3, nullable: false, default: 'NGN' })
  defaultCurrency!: string;

  @Column({ type: 'varchar', length: 100, nullable: false, default: 'Africa/Lagos' })
  timezone!: string;

  @Index()
  @Column({ type: 'varchar', length: 30, nullable: false, default: 'active' })
  status!: string;
}
