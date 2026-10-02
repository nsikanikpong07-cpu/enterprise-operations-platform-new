import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';
import { CompanyUser } from '../../iam/entities/company-user.entity.js';
import { SupplierCompanyProfile } from '../../vendor/entities/supplier-company-profile.entity.js';
import { Requisition } from './requisition.entity.js';

@Entity({ schema: 'procurement', name: 'purchase_orders' })
@Unique(['company', 'poNumber'])
@Check(`status IN ('Draft', 'Submitted', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed')`)
@Check(`total_amount >= 0`)
export class PurchaseOrder extends BaseEntity {
  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  poNumber!: string;

  @ManyToOne(() => Requisition, { nullable: false })
  @JoinColumn({ name: 'requisition_id' })
  requisition!: Requisition;

  @ManyToOne(() => SupplierCompanyProfile, { nullable: false })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: SupplierCompanyProfile;

  @ManyToOne(() => CompanyUser, { nullable: false })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: CompanyUser;

  @Column({ type: 'date', nullable: false, default: () => 'CURRENT_DATE' })
  orderDate!: Date;

  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate?: Date;

  @Column({ type: 'char', length: 3, nullable: false, default: 'NGN' })
  currency!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false, default: 0 })
  totalAmount!: number;

  @Index()
  @Column({ type: 'varchar', length: 30, nullable: false, default: 'Issued' })
  status!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentTerms?: string;
}
