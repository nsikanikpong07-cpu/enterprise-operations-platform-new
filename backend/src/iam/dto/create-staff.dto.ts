import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { CreateUserDto } from "./user.dto.js";

// Login and employment details are saved together in one transaction.
export class CreateStaffDto extends CreateUserDto {
  @IsUUID()
  companyId!: string;

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
