import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
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
