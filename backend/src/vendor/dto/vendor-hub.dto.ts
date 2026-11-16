import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSupplierRelationshipDto {
  @IsOptional() @IsString() @MaxLength(100) supplierCode?: string;
  @IsOptional() @IsIn(['prospective', 'active', 'suspended', 'blocked', 'inactive']) relationshipStatus?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
