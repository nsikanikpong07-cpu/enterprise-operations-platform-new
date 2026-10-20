import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { CompanyUser } from '../../iam/entities/company-user.entity.js';
import { PurchaseOrder } from './purchase-order.entity.js';

@Entity({ schema: 'procurement', name: 'goods_receipts' })
@Check(`receipt_status IN ('Pending', 'Partially Received', 'Completed')`)
export class GoodsReceipt extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  receiptNumber!: string;

  @ManyToOne(() => PurchaseOrder, { nullable: false })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder!: PurchaseOrder;

  @ManyToOne(() => CompanyUser, { nullable: false })
  @JoinColumn({ name: 'received_by' })
  receivedBy!: CompanyUser;

  @Column({ type: 'timestamptz', nullable: false, default: () => 'NOW()' })
  receiptDate!: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deliveryNoteNumber?: string;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'Pending' })
  receiptStatus!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  remarks?: string;
}
