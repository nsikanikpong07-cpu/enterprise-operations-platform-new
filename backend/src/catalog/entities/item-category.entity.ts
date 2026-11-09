import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';

@Entity({ schema: 'catalog', name: 'item_categories' })
@Unique(['company', 'name'])
export class ItemCategory extends BaseEntity {
  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @ManyToOne(() => ItemCategory, (category) => category.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: ItemCategory;

  @OneToMany(() => ItemCategory, (category) => category.parent)
  children!: ItemCategory[];

  @Column({ type: 'varchar', length: 150, nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
