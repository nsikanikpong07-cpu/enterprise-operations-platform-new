import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RequisitionItemDto {
  @IsUUID()
  itemId!: string;

  @IsString()
  @MaxLength(500)
  description!: string;

  @IsNumber()
  @Min(0.01)
  quantityRequested!: number;

  @IsUUID()
  unitOfMeasureId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedUnitPrice?: number;

  @IsOptional()
  @IsDateString()
  requiredDate?: string;
}

export class CreateRequisitionDto {
  @IsUUID()
  companyId!: string;

  @IsString()
  @MaxLength(50)
  requisitionNumber!: string;

  @IsUUID()
  requesterId!: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsDateString()
  requiredDate?: string;

  @IsString()
  @MaxLength(500)
  justification!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RequisitionItemDto)
  items!: RequisitionItemDto[];
}

export class UpdateRequisitionDto {
  @IsOptional()
  @IsIn([
    'Draft',
    'Submitted',
    'Pending',
    'Approved',
    'Rejected',
    'Cancelled',
    'Completed',
  ])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  justification?: string;
}

export class CreateApprovalDto {
  @IsUUID()
  requisitionId!: string;

  @IsUUID()
  approverId!: string;

  @IsInt()
  @Min(1)
  approvalLevel!: number;
}

export class DecideApprovalDto {
  @IsIn(['Approved', 'Rejected'])
  approvalStatus!: 'Approved' | 'Rejected';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comments?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

export class PurchaseOrderItemDto {
  @IsOptional()
  @IsUUID()
  requisitionItemId?: string;

  @IsUUID()
  itemId!: string;

  @IsString()
  @MaxLength(500)
  description!: string;

  @IsNumber()
  @Min(0.01)
  quantityOrdered!: number;

  @IsUUID()
  unitOfMeasureId!: string;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  companyId!: string;

  @IsString()
  @MaxLength(50)
  poNumber!: string;

  @IsUUID()
  requisitionId!: string;

  @IsUUID()
  supplierId!: string;

  @IsUUID()
  buyerId!: string;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentTerms?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsIn([
    'Draft',
    'Submitted',
    'Pending',
    'Approved',
    'Rejected',
    'Cancelled',
    'Completed',
  ])
  status?: string;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentTerms?: string;
}

export class GoodsReceiptItemDto {
  @IsUUID()
  purchaseOrderItemId!: string;

  @IsNumber()
  @Min(0)
  quantityReceived!: number;

  @IsNumber()
  @Min(0)
  quantityAccepted!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityRejected?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

export class CreateGoodsReceiptDto {
  @IsString()
  @MaxLength(50)
  receiptNumber!: string;

  @IsUUID()
  purchaseOrderId!: string;

  @IsUUID()
  receivedById!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  deliveryNoteNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptItemDto)
  items!: GoodsReceiptItemDto[];
}
