import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../iam/entities/user.entity.js';
import { VerificationCase } from './verification-case.entity.js';

@Entity({ schema: 'vendor', name: 'supplier_risk_assessments' })
@Check(`risk_level IN ('low', 'medium', 'high', 'critical')`)
@Check(`risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100)`)
export class SupplierRiskAssessment extends BaseEntity {
  @ManyToOne(() => VerificationCase, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'verification_case_id' })
  verificationCase!: VerificationCase;

  @Column({ type: 'varchar', length: 30, nullable: false })
  riskLevel!: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  riskScore?: number;

  @Column({ type: 'text', nullable: true })
  rationale?: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'assessed_by' })
  assessedBy!: User;

  @Column({ type: 'timestamptz', nullable: false, default: () => 'NOW()' })
  assessedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;
}
