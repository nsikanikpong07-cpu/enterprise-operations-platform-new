import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../iam/entities/user.entity.js';
import { SupplierCompanyProfile } from './supplier-company-profile.entity.js';
import { Supplier } from './supplier.entity.js';

@Entity({ schema: 'vendor', name: 'verification_cases' })
@Check(`verification_type IN ('initial', 'periodic', 'renewal', 're_verification')`)
@Check(`status IN ('open', 'in_progress', 'approved', 'rejected', 'expired', 'cancelled')`)
export class VerificationCase extends BaseEntity {
  @ManyToOne(() => SupplierCompanyProfile, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_company_profile_id' })
  companyProfile?: SupplierCompanyProfile | null;

  @ManyToOne(() => Supplier, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier?: Supplier | null;

  @Index({ unique: true })
  @Column({ name: 'case_number', type: 'varchar', length: 100, nullable: false, unique: true })
  caseNumber!: string;

  @Column({ name: 'verification_type', type: 'varchar', length: 50, nullable: false, default: 'initial' })
  verificationType!: string;

  @Column({ name: 'decision_source', type: 'varchar', length: 30, nullable: false, default: 'manual' })
  decisionSource!: string;

  @Index()
  @Column({ name: 'status', type: 'varchar', length: 30, nullable: false, default: 'open' })
  status!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'opened_by' })
  openedBy!: User;

  @Column({ name: 'opened_at', type: 'timestamptz', nullable: false, default: () => 'NOW()' })
  openedAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedById?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_reviewer_id' })
  assignedReviewer?: User | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;
}
