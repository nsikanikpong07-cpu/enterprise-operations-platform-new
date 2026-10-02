import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../iam/entities/user.entity.js';
import { SupplierCompanyProfile } from './supplier-company-profile.entity.js';

@Entity({ schema: 'vendor', name: 'verification_cases' })
@Check(`verification_type IN ('initial', 'periodic', 'renewal', 're_verification')`)
@Check(`status IN ('open', 'in_progress', 'approved', 'rejected', 'expired', 'cancelled')`)
export class VerificationCase extends BaseEntity {
  @ManyToOne(() => SupplierCompanyProfile, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_company_profile_id' })
  companyProfile!: SupplierCompanyProfile;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  caseNumber!: string;

  @Column({ type: 'varchar', length: 50, nullable: false, default: 'initial' })
  verificationType!: string;

  @Index()
  @Column({ type: 'varchar', length: 30, nullable: false, default: 'open' })
  status!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'opened_by' })
  openedBy!: User;

  @Column({ type: 'timestamptz', nullable: false, default: () => 'NOW()' })
  openedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;
}
