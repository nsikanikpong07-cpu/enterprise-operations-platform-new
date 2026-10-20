import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRoleDto {
  // The company that owns the new role.
  @IsUUID()
  companyId!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRoleDto {
  // Company ownership cannot be changed through this DTO.
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreatePermissionDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AssignRoleDto {
  // This is a company membership ID, not a login user ID.
  @IsUUID()
  companyUserId!: string;

  @IsUUID()
  roleId!: string;
}

export class GrantPermissionDto {
  @IsUUID()
  roleId!: string;

  @IsUUID()
  permissionId!: string;
}

export class AddCompanyUserDto {
  @IsUUID()
  companyId!: string;

  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  employeeNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  jobTitle?: string;
}

export class UpdateCompanyUserDto {
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  jobTitle?: string;

  @IsOptional()
  @IsIn(['active', 'suspended', 'inactive'])
  status?: string;
}