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
import { Company } from './company.entity.js';

@Entity({ schema: 'organization', name: 'locations' })
@Unique(['company', 'code'])
@Check(`type IN ('office', 'warehouse', 'branch', 'site', 'factory', 'other')`)
export class Location extends BaseEntity {
  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column({ type: 'varchar', length: 150, nullable: false })
  name!: string;

  @Index()
  @Column({ type: 'varchar', length: 50, nullable: false })
  code!: string;

  @Column({ type: 'varchar', length: 50, nullable: false, default: 'office' })
  type!: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state?: string;

  @Column({ type: 'char', length: 2, nullable: true })
  countryCode?: string;

  @Column({ type: 'boolean', nullable: false, default: true })
  isActive!: boolean;
}
