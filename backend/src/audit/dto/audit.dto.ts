import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class AuditLogQueryDto {
  @ApiProperty({ type: String, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  companyId!: string;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  action?: string;
}

export class CreateAuditLogDto {
  @ApiPropertyOptional({ type: String, nullable: true, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ type: String, maxLength: 100 })
  @IsString()
  @MaxLength(100)
  action!: string;

  @ApiProperty({ type: String, maxLength: 100 })
  @IsString()
  @MaxLength(100)
  entityType!: string;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ type: Object, nullable: true })
  @IsOptional()
  oldValues?: object;

  @ApiPropertyOptional({ type: Object, nullable: true })
  @IsOptional()
  newValues?: object;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
