import { Check, Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';
import { Department } from '../../organization/entities/department.entity.js';
import { CompanyUser } from '../../iam/entities/company-user.entity.js';

@Entity({ schema: 'procurement', name: 'requisitions' })
@Unique(['company', 'requisitionNumber'])
@Check(`status IN ('Draft', 'Submitted', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed')`)
@Check(`approval_status IN ('Pending', 'Approved', 'Rejected')`)
@Check(`total_estimated_amount IS NULL OR total_estimated_amount >= 0`)
export class Requisition extends BaseEntity {
  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  requisitionNumber!: string;

  @ManyToOne(() => CompanyUser, { nullable: false })
  @JoinColumn({ name: 'requester_id' })
  requester!: CompanyUser;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @Column({ type: 'date', nullable: false, default: () => 'CURRENT_DATE' })
  requestDate!: Date;

  @Column({ type: 'date', nullable: true })
  requiredDate?: Date;

  @Index()
  @Column({ type: 'varchar', length: 30, nullable: false, default: 'Draft' })
  status!: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  justification!: string;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'Pending' })
  approvalStatus!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalEstimatedAmount?: number;
}
