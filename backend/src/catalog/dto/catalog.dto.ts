import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateItemDto {
  @IsUUID()
  companyId!: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsUUID()
  unitOfMeasureId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['material', 'service', 'asset'])
  itemType?: string;

  @IsOptional()
  @IsBoolean()
  isStockable?: boolean;
}

export class UpdateItemDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['material', 'service', 'asset'])
  itemType?: string;

  @IsOptional()
  @IsBoolean()
  isStockable?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateItemCategoryDto {
  @IsUUID()
  companyId!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsString()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateItemCategoryDto {
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateUnitOfMeasureDto {
  @IsString()
  @MaxLength(20)
  code!: string;

  @IsString()
  @MaxLength(100)
  name!: string;
}
