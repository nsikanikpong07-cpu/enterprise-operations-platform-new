import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity({ schema: 'iam', name: 'permissions' })
export class Permission extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150, nullable: false, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
