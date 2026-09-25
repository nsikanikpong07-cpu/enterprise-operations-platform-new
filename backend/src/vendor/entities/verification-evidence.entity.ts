import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../iam/entities/user.entity.js';
import { SupplierDocument } from './supplier-document.entity.js';
import { VerificationCheck } from './verification-check.entity.js';

@Entity({ schema: 'vendor', name: 'verification_evidence' })
export class VerificationEvidence extends BaseEntity {
  @ManyToOne(() => VerificationCheck, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'verification_check_id' })
  check!: VerificationCheck;

  @ManyToOne(() => SupplierDocument, { nullable: true })
  @JoinColumn({ name: 'supplier_document_id' })
  supplierDocument?: SupplierDocument;

  @Column({ type: 'varchar', length: 100, nullable: false })
  evidenceType!: string;

  @Column({ type: 'text', nullable: true })
  fileUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy!: User;
}
