import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../iam/entities/user.entity.js';
import { VerificationCase } from './verification-case.entity.js';

@Entity({ schema: 'vendor', name: 'verification_checks' })
@Check(`status IN ('pending', 'in_progress', 'passed', 'failed', 'waived')`)
export class VerificationCheck extends BaseEntity {
  @ManyToOne(() => VerificationCase, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'verification_case_id' })
  verificationCase!: VerificationCase;

  @Column({ name: 'check_type', type: 'varchar', length: 100, nullable: false })
  checkType!: string;

  @Column({ name: 'name', type: 'varchar', length: 150, nullable: false })
  name!: string;

  @Column({ name: 'status', type: 'varchar', length: 30, nullable: false, default: 'pending' })
  status!: string;

  @Column({ name: 'is_required', type: 'boolean', nullable: false, default: true })
  isRequired!: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'checked_by' })
  checkedBy?: User;

  @Column({ name: 'checked_at', type: 'timestamptz', nullable: true })
  checkedAt?: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;
}
