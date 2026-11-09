import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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
  @ApiProperty({ type: String, format: 'email', example: 'person@example.com', maxLength: 255 })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(255)
  email!: string;
  @ApiProperty({ type: String, format: 'password', writeOnly: true, example: 'ExamplePassword123!' , minLength: 15, maxLength: 128 })
  @IsString()
  @Length(15, 128)
  password!: string;
  @ApiProperty({ type: String, maxLength: 100, minLength: 1 })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;
  @ApiProperty({ type: String, maxLength: 100, minLength: 1 })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;
  @ApiPropertyOptional({ type: String, nullable: true, description: "Phone number accepted by IsPhoneNumber (include the country calling code)." })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}

export class RegisterOrganizationDto {
  @ApiProperty({ type: String, enum: ["company", "vendor", "both"] })
  @IsIn(["company", "vendor", "both"])
  accountType!: "company" | "vendor" | "both";
  @ApiProperty({ type: String, maxLength: 255, minLength: 1 })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;
  // Vendor Hub registration requires a legal name; it stays optional for buyers.
  @ApiPropertyOptional({ type: String, maxLength: 255, minLength: 1, description: "Required when accountType is vendor or both; optional for company." })
  @ValidateIf(
    (object: RegisterOrganizationDto, value) =>
      object.accountType !== "company" || value != null,
  )
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
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
  @ApiPropertyOptional({ type: String, nullable: true, example: 'NG', pattern: "^[A-Z]{2}$" })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  countryCode?: string;
  @ApiPropertyOptional({ type: String, nullable: true, example: 'NGN', pattern: "^[A-Z]{3}$" })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  defaultCurrency?: string;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;
  @ApiProperty({ type: () => RegistrationOwnerDto })
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => RegistrationOwnerDto)
  owner!: RegistrationOwnerDto;
}
