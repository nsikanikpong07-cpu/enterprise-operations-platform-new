import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity({ schema: 'catalog', name: 'units_of_measure' })
export class UnitOfMeasure extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, nullable: false, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;
}
