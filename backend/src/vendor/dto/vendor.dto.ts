import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsArray,
  ArrayMaxSize,
  IsDateString,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ type: String, maxLength: 255 })
  @IsString()
  @MaxLength(255)
  legalName!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tradingName?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxIdentificationNumber?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  supplierType?: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'NG', minLength: 2, maxLength: 2 })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;
}

export class UpdateSupplierDto {
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tradingName?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  supplierType?: string;

  @ApiPropertyOptional({ type: String, nullable: true, enum: ['active', 'inactive', 'suspended'] })
  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended'])
  status?: string;
}

export class OnboardSupplierDto {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  supplierId!: string;

  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  companyId!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierCode?: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSupplierProfileDto {
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierCode?: string;

  @ApiPropertyOptional({ type: String, nullable: true, enum: ['prospective', 'active', 'suspended', 'blocked', 'inactive'] })
  @IsOptional()
  @IsIn(['prospective', 'active', 'suspended', 'blocked', 'inactive'])
  relationshipStatus?: string;

  @ApiPropertyOptional({ type: String, nullable: true, enum: ['pending', 'in_progress', 'completed', 'rejected'] })
  @IsOptional()
  @IsIn(['pending', 'in_progress', 'completed', 'rejected'])
  onboardingStatus?: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSupplierContactDto {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  supplierId!: string;

  @ApiProperty({ type: String, maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'email', example: 'person@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  position?: string;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class SupplierWorkspaceProfileDto {
  @ApiPropertyOptional({ type: String, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string;

  @ApiPropertyOptional({ type: String, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tradingName?: string;

  @ApiPropertyOptional({ type: String, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string;

  @ApiPropertyOptional({ type: String, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxIdentificationNumber?: string;

  @ApiPropertyOptional({ type: String, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  supplierType?: string;

  @ApiPropertyOptional({ type: String, minLength: 2, maxLength: 2, example: 'NG' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;
}

export class SupplierWorkspaceContactDto {
  @ApiProperty({ type: String, maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  position?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateSupplierWorkspaceContactDto {
  @ApiPropertyOptional({ type: String, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  position?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class SupplierListingDto {
  @ApiProperty({ enum: ['product', 'service'] })
  @IsIn(['product', 'service'])
  listingType!: 'product' | 'service';

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ maxLength: 150 })
  @IsString()
  @MaxLength(150)
  category!: string;

  @ApiProperty({ maxLength: 3000 })
  @IsString()
  @MaxLength(3000)
  description!: string;

  @ApiProperty({ enum: ['fixed', 'price_on_request'] })
  @IsIn(['fixed', 'price_on_request'])
  pricingModel!: 'fixed' | 'price_on_request';

  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number | null;

  @ApiPropertyOptional({ minLength: 3, maxLength: 3, default: 'NGN' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  unit?: string;

  @ApiPropertyOptional({ maxLength: 1500 })
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  specifications?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  dimensions?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceArea?: string;

  @ApiPropertyOptional({ type: [String], maxItems: 5, description: 'Photo IDs returned by the private supplier listing photo upload.' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUUID(undefined, { each: true })
  photos?: string[];
}

export class UpdateSupplierListingDto {
  @ApiPropertyOptional({ enum: ['product', 'service'] })
  @IsOptional()
  @IsIn(['product', 'service'])
  listingType?: 'product' | 'service';

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  category?: string;

  @ApiPropertyOptional({ maxLength: 3000 })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;

  @ApiPropertyOptional({ enum: ['fixed', 'price_on_request'] })
  @IsOptional()
  @IsIn(['fixed', 'price_on_request'])
  pricingModel?: 'fixed' | 'price_on_request';

  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number | null;

  @ApiPropertyOptional({ minLength: 3, maxLength: 3 })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  unit?: string;

  @ApiPropertyOptional({ maxLength: 1500 })
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  specifications?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  dimensions?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceArea?: string;

  @ApiPropertyOptional({ type: [String], maxItems: 5 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUUID(undefined, { each: true })
  photos?: string[];
}

export class CreateSupplierDocumentDto {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  supplierId!: string;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  companyProfileId?: string;

  @ApiProperty({ type: String, maxLength: 100 })
  @IsString()
  @MaxLength(100)
  documentType!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  documentNumber?: string;

  @ApiProperty({ type: String, description: "Stored file location; this endpoint accepts JSON, not a file upload." })
  @IsString()
  fileUrl!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  fileHash?: string;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'ISO 8601 date or timestamp.', example: '2026-10-28' })
  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'ISO 8601 date or timestamp.', example: '2026-10-28' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  uploadedById?: string;
}

export class OpenVerificationCaseDto {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  companyProfileId!: string;

  @ApiProperty({ type: String, maxLength: 100 })
  @IsString()
  @MaxLength(100)
  caseNumber!: string;

  @ApiPropertyOptional({ type: String, nullable: true, enum: ['initial', 'periodic', 'renewal', 're_verification'] })
  @IsOptional()
  @IsIn(['initial', 'periodic', 'renewal', 're_verification'])
  verificationType?: string;

  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  openedById!: string;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'ISO 8601 date or timestamp.', example: '2026-10-28' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateVerificationCaseDto {
  @ApiPropertyOptional({ type: String, nullable: true, enum: ['open', 'in_progress', 'approved', 'rejected', 'expired', 'cancelled'] })
  @IsOptional()
  @IsIn(['open', 'in_progress', 'approved', 'rejected', 'expired', 'cancelled'])
  status?: string;
}

export class CreateRiskAssessmentDto {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  verificationCaseId!: string;

  @ApiProperty({ type: String, enum: ['low', 'medium', 'high', 'critical'] })
  @IsIn(['low', 'medium', 'high', 'critical'])
  riskLevel!: string;

  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  riskScore?: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  rationale?: string;

  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  assessedById!: string;
}
