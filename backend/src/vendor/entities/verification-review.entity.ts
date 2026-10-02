import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../iam/entities/user.entity.js';
import { VerificationCase } from './verification-case.entity.js';

@Entity({ schema: 'vendor', name: 'verification_reviews' })
@Check(`decision IN ('approved', 'rejected', 'requires_changes')`)
export class VerificationReview extends BaseEntity {
  @ManyToOne(() => VerificationCase, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'verification_case_id' })
  verificationCase!: VerificationCase;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'reviewer_user_id' })
  reviewer!: User;

  @Column({ type: 'varchar', length: 30, nullable: false })
  decision!: string;

  @Column({ type: 'text', nullable: true })
  comments?: string;

  @Column({ type: 'timestamptz', nullable: false, default: () => 'NOW()' })
  reviewedAt!: Date;
}
