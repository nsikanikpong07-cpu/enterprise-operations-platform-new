import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  ValidateIf,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from "class-validator";

export class CreateCompanyDto {
  @ApiProperty({ type: String, maxLength: 255, minLength: 1 })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string;

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

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'NG', minLength: 2, maxLength: 2 })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'NGN', minLength: 3, maxLength: 3 })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  defaultCurrency?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional({ type: String, maxLength: 255, minLength: 1 })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional({ type: String, enum: ["active", "suspended", "inactive"] })
  @ValidateIf((_object, value) => value !== undefined)
  @IsIn(["active", "suspended", "inactive"])
  status?: string;
}

export class CreateDepartmentDto {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  companyId!: string;

  @ApiProperty({ type: String, maxLength: 150, minLength: 1 })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  managerId?: string;
}

export class UpdateDepartmentDto {
  @ApiPropertyOptional({ type: String, maxLength: 150, minLength: 1 })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  managerId?: string;
}

export class CreateLocationDto {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  companyId!: string;

  @ApiProperty({ type: String, maxLength: 150, minLength: 1 })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ type: String, maxLength: 50, minLength: 1 })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  code!: string;

  @ApiPropertyOptional({ type: String, nullable: true, enum: ["office", "warehouse", "branch", "site", "factory", "other"] })
  @IsOptional()
  @IsIn(["office", "warehouse", "branch", "site", "factory", "other"])
  type?: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'NG', minLength: 2, maxLength: 2 })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;
}

export class UpdateLocationDto {
  @ApiPropertyOptional({ type: String, maxLength: 150, minLength: 1 })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ type: Boolean })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;
}
