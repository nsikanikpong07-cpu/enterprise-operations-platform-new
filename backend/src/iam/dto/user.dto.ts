import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  MaxLength,
} from "class-validator";

export class CreateUserDto {
  @ApiProperty({ type: String, format: 'email', example: 'person@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ type: String, format: 'password', writeOnly: true, example: 'ExamplePassword123!' , minLength: 15, maxLength: 128 })
  @IsString()
  @Length(15, 128)
  password!: string;

  @ApiProperty({ type: String, maxLength: 100 })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ type: String, maxLength: 100 })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({ type: String, nullable: true, description: "Phone number accepted by IsPhoneNumber (include the country calling code)." })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ type: String, nullable: true, description: "Phone number accepted by IsPhoneNumber (include the country calling code)." })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ type: String, nullable: true, enum: ["active", "suspended", "inactive"] })
  @IsOptional()
  @IsIn(["active", "suspended", "inactive"])
  status?: string;
}
