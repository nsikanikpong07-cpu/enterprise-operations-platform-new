import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';
import { Supplier } from './supplier.entity.js';

@Entity({ schema: 'vendor', name: 'supplier_company_profiles' })
@Unique(['supplier', 'company'])
@Unique(['company', 'supplierCode'])
@Check(`relationship_status IN ('prospective', 'active', 'suspended', 'blocked', 'inactive')`)
@Check(`onboarding_status IN ('pending', 'in_progress', 'completed', 'rejected')`)
export class SupplierCompanyProfile extends BaseEntity {
  @ManyToOne(() => Supplier, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  supplierCode?: string;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'prospective' })
  relationshipStatus!: string;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'pending' })
  onboardingStatus!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
