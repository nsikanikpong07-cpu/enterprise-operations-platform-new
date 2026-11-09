import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../iam/entities/user.entity.js';
import { SupplierCompanyProfile } from './supplier-company-profile.entity.js';
import { Supplier } from './supplier.entity.js';

@Entity({ schema: 'vendor', name: 'supplier_documents' })
@Check(`status IN ('pending', 'valid', 'expired', 'rejected')`)
export class SupplierDocument extends BaseEntity {
  @ManyToOne(() => Supplier, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @ManyToOne(() => SupplierCompanyProfile, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_company_profile_id' })
  companyProfile?: SupplierCompanyProfile;

  @Column({ name: 'document_type', type: 'varchar', length: 100, nullable: false })
  documentType!: string;

  @Column({ name: 'document_number', type: 'varchar', length: 150, nullable: true })
  documentNumber?: string;

  @Column({ name: 'file_url', type: 'text', nullable: false })
  fileUrl!: string;

  @Column({ name: 'file_hash', type: 'varchar', length: 128, nullable: true })
  fileHash?: string;

  @Column({ name: 'issued_at', type: 'date', nullable: true })
  issuedAt?: Date;

  @Column({ name: 'expires_at', type: 'date', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'status', type: 'varchar', length: 30, nullable: false, default: 'pending' })
  status!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy?: User;
}
