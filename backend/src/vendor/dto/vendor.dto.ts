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
  @IsString()
  @MaxLength(255)
  legalName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  tradingName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxIdentificationNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  supplierType?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;
}

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tradingName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  supplierType?: string;

  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended'])
  status?: string;
}

export class OnboardSupplierDto {
  @IsUUID()
  supplierId!: string;

  @IsUUID()
  companyId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSupplierProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierCode?: string;

  @IsOptional()
  @IsIn(['prospective', 'active', 'suspended', 'blocked', 'inactive'])
  relationshipStatus?: string;

  @IsOptional()
  @IsIn(['pending', 'in_progress', 'completed', 'rejected'])
  onboardingStatus?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSupplierContactDto {
  @IsUUID()
  supplierId!: string;

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  position?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateSupplierDocumentDto {
  @IsUUID()
  supplierId!: string;

  @IsOptional()
  @IsUUID()
  companyProfileId?: string;

  @IsString()
  @MaxLength(100)
  documentType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  documentNumber?: string;

  @IsString()
  fileUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  fileHash?: string;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsUUID()
  uploadedById?: string;
}

export class OpenVerificationCaseDto {
  @IsUUID()
  companyProfileId!: string;

  @IsString()
  @MaxLength(100)
  caseNumber!: string;

  @IsOptional()
  @IsIn(['initial', 'periodic', 'renewal', 're_verification'])
  verificationType?: string;

  @IsUUID()
  openedById!: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateVerificationCaseDto {
  @IsOptional()
  @IsIn(['open', 'in_progress', 'approved', 'rejected', 'expired', 'cancelled'])
  status?: string;
}

export class CreateRiskAssessmentDto {
  @IsUUID()
  verificationCaseId!: string;

  @IsIn(['low', 'medium', 'high', 'critical'])
  riskLevel!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  riskScore?: number;

  @IsOptional()
  @IsString()
  rationale?: string;

  @IsUUID()
  assessedById!: string;
}
