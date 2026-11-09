import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';

@Entity({ schema: 'iam', name: 'roles' })

// Different companies can use the same role name.
// A company cannot have two roles with the same name.
@Unique('uq_roles_company_name', ['company', 'name'])
export class Role extends BaseEntity {
  // The company that owns this role.
  @Index()
  @ManyToOne(() => Company, {
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  name!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;
}