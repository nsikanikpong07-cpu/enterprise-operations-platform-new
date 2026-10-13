import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';
import { User } from './user.entity.js';

@Entity({ schema: 'iam', name: 'company_users' })

// One staff account may belong to only one company.
// Suspended and inactive memberships still count.
@Unique('uq_company_users_user', ['user'])

// An employee number is unique within its company.
@Unique(['company', 'employeeNumber'])

@Check(`status IN ('active', 'suspended', 'inactive')`)
export class CompanyUser extends BaseEntity {
  @ManyToOne(() => Company, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({
    name: 'department_id',
    type: 'uuid',
    nullable: true,
  })
  departmentId?: string;

  @Column({
    name: 'employee_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  employeeNumber?: string;

  @Column({
    name: 'job_title',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  jobTitle?: string;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: false,
    default: 'active',
  })
  status!: string;
}