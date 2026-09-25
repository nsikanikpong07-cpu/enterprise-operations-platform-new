import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
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
