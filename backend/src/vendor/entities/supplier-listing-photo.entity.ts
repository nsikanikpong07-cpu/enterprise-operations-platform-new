import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Supplier } from './supplier.entity.js';

@Entity({ schema: 'vendor', name: 'supplier_listing_photos' })
export class SupplierListingPhoto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Supplier, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @Column({ name: 'storage_key', type: 'varchar', length: 255, unique: true })
  storageKey!: string;

  @Column({ name: 'content_type', type: 'varchar', length: 50 })
  contentType!: string;

  @Column({ name: 'file_hash', type: 'char', length: 64 })
  fileHash!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;
}
