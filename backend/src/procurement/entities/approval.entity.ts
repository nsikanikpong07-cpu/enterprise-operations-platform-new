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

  @Column({name: 'approval_level', type: 'int', nullable: false })
  approvalLevel!: number;

  @Column({name: 'approval_status', type: 'varchar', length: 30, nullable: false, default: 'Pending' })
  approvalStatus!: string;

  @Column({ name: 'approval_date', type: 'timestamptz', nullable: true })
  approvalDate?: Date;

  @Column({ name: 'comments', type: 'varchar', length: 500, nullable: true })
  comments?: string;

  @Column({ name: 'rejection_reason', type: 'varchar', length: 500, nullable: true })
  rejectionReason?: string;
}
