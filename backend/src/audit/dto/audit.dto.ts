import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class AuditLogQueryDto {
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  action?: string;
}

export class CreateAuditLogDto {
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  @MaxLength(100)
  action!: string;

  @IsString()
  @MaxLength(100)
  entityType!: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  oldValues?: object;

  @IsOptional()
  newValues?: object;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
