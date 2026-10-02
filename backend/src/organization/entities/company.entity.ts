import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'organization', name: 'companies' })
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column()
  name!: string;

  @Column({ name: 'legal_name', nullable: true })
  legalName?: string;

  @Column({ name: 'registration_number', nullable: true })
  registrationNumber?: string;

  @Column({ name: 'tax_identification_number', nullable: true })
  taxIdentificationNumber?: string;

  @Column({ nullable: true })
  industry?: string;

  @Column({ name: 'country_code', nullable: true })
  countryCode?: string;

  @Column({ name: 'default_currency', nullable: true })
  defaultCurrency?: string;

  @Column({ nullable: true })
  timezone?: string;

  @Column({ default: 'Active' })
  status!: string;
}