import { Check, Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { CompanyUser } from '../../iam/entities/company-user.entity.js';
import { Requisition } from './requisition.entity.js';

@Entity({ schema: 'procurement', name: 'approvals' })
@Unique(['requisition', 'approvalLevel'])
@Check(`approval_status IN ('Pending', 'Approved', 'Rejected')`)
@Check(`approval_level > 0`)
export class Approval extends BaseEntity {
  @ManyToOne(() => Requisition, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'requisition_id' })
  requisition!: Requisition;

  @ManyToOne(() => CompanyUser, { nullable: false })
  @JoinColumn({ name: 'approver_id' })
  approver!: CompanyUser;

  @Column({ type: 'int', nullable: false })
  approvalLevel!: number;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'Pending' })
  approvalStatus!: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvalDate?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  comments?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  rejectionReason?: string;
}
