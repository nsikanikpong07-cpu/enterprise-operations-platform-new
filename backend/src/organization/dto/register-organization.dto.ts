import { Transform, Type } from "class-transformer";
import {
  IsDefined,
  IsObject,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
  ValidateIf,
} from "class-validator";

export class RegistrationOwnerDto {
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(255)
  email!: string;
  @IsString()
  @Length(15, 128)
  password!: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}

export class RegisterOrganizationDto {
  @IsIn(["company", "vendor", "both"])
  accountType!: "company" | "vendor" | "both";
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;
  // Vendor Hub registration requires a legal name; it stays optional for buyers.
  @ValidateIf(
    (object: RegisterOrganizationDto, value) =>
      object.accountType !== "company" || value != null,
  )
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  legalName?: string;
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
  @MaxLength(100)
  industry?: string;
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  countryCode?: string;
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  defaultCurrency?: string;
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => RegistrationOwnerDto)
  owner!: RegistrationOwnerDto;
}
