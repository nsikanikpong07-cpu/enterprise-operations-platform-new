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
import { CompanyUser } from '../../iam/entities/company-user.entity.js';
import { Company } from './company.entity.js';

@Entity({ schema: 'organization', name: 'departments' })
@Unique(['company', 'name'])
@Unique(['company', 'code'])
@Check(`btrim(name) <> ''`)
export class Department extends BaseEntity {
  @ManyToOne(() => Company, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column({ type: 'varchar', length: 150, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  code?: string;

  @ManyToOne(() => CompanyUser, { nullable: true })
  @JoinColumn({ name: 'manager_company_user_id' })
  manager?: CompanyUser;
}
