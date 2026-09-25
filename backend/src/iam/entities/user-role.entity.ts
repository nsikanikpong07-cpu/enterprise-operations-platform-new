import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Role } from './role.entity.js';
import { CompanyUser } from './company-user.entity.js';

@Entity({ schema: 'iam', name: 'user_roles' })
@Unique(['companyUser', 'role'])
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => CompanyUser, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_user_id' })
  companyUser!: CompanyUser;

  @ManyToOne(() => Role, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;
}
