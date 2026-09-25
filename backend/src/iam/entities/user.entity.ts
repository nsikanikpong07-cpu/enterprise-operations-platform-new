import { Check, Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity({ schema: 'iam', name: 'users' })
@Check(`status IN ('active', 'suspended', 'inactive')`)
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email!: string;

  @Column({ type: 'text', nullable: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  lastName!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'active' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;
}
