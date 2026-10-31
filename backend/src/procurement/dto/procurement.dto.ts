import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  itemId!: string;

  @ApiProperty({ type: String, maxLength: 500 })
  @IsString()
  @MaxLength(500)
  description!: string;

  @ApiProperty({ type: Number, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  quantityRequested!: number;

  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  unitOfMeasureId!: string;

  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedUnitPrice?: number;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'ISO 8601 date or timestamp.', example: '2026-10-28' })
  @IsOptional()
  @IsDateString()
  requiredDate?: string;
}

export class CreateRequisitionDto {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  companyId!: string;

  @ApiProperty({ type: String, maxLength: 50 })
  @IsString()
  @MaxLength(50)
  requisitionNumber!: string;

  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  requesterId!: string;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'ISO 8601 date or timestamp.', example: '2026-10-28' })
  @IsOptional()
  @IsDateString()
  requiredDate?: string;

  @ApiProperty({ type: String, maxLength: 500 })
  @IsString()
  @MaxLength(500)
  justification!: string;

  @ApiProperty({ type: () => RequisitionItemDto, isArray: true, minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RequisitionItemDto)
  items!: RequisitionItemDto[];
}

export class UpdateRequisitionDto {
  @ApiPropertyOptional({ type: String, nullable: true, enum: [ 'Draft', 'Submitted', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed', ] })
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

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  justification?: string;
}

export class CreateApprovalDto {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  requisitionId!: string;

  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  approverId!: string;

  @ApiProperty({ type: 'integer', minimum: 1 })
  @IsInt()
  @Min(1)
  approvalLevel!: number;
}

export class DecideApprovalDto {
  @ApiProperty({ type: String, enum: ['Approved', 'Rejected'] })
  @IsIn(['Approved', 'Rejected'])
  approvalStatus!: 'Approved' | 'Rejected';

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comments?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

export class PurchaseOrderItemDto {
  @ApiPropertyOptional({ type: String, nullable: true, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  requisitionItemId?: string;

  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  itemId!: string;

  @ApiProperty({ type: String, maxLength: 500 })
  @IsString()
  @MaxLength(500)
  description!: string;

  @ApiProperty({ type: Number, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  quantityOrdered!: number;

  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  unitOfMeasureId!: string;

  @ApiProperty({ type: Number, minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'ISO 8601 date or timestamp.', example: '2026-10-28' })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  companyId!: string;

  @ApiProperty({ type: String, maxLength: 50 })
  @IsString()
  @MaxLength(50)
  poNumber!: string;

  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  requisitionId!: string;

  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  supplierId!: string;

  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  buyerId!: string;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'ISO 8601 date or timestamp.', example: '2026-10-28' })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'NGN', minLength: 3, maxLength: 3 })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentTerms?: string;

  @ApiProperty({ type: () => PurchaseOrderItemDto, isArray: true, minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto {
  @ApiPropertyOptional({ type: String, nullable: true, enum: [ 'Draft', 'Submitted', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed', ] })
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

  @ApiPropertyOptional({ type: String, nullable: true, description: 'ISO 8601 date or timestamp.', example: '2026-10-28' })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentTerms?: string;
}

export class GoodsReceiptItemDto {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  purchaseOrderItemId!: string;

  @ApiProperty({ type: Number, minimum: 0 })
  @IsNumber()
  @Min(0)
  quantityReceived!: number;

  @ApiProperty({ type: Number, minimum: 0 })
  @IsNumber()
  @Min(0)
  quantityAccepted!: number;

  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityRejected?: number;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

export class CreateGoodsReceiptDto {
  @ApiProperty({ type: String, maxLength: 50 })
  @IsString()
  @MaxLength(50)
  receiptNumber!: string;

  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  purchaseOrderId!: string;

  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  receivedById!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deliveryNoteNumber?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @ApiProperty({ type: () => GoodsReceiptItemDto, isArray: true, minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptItemDto)
  items!: GoodsReceiptItemDto[];
}
