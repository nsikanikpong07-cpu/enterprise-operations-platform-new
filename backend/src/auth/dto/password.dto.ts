import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length, Matches, MaxLength } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({ type: String, format: 'email', example: 'person@example.com', maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ type: String, example: 'Abcdefghijklmnopqrstuvwxyz0123456789_ABCDEF', minLength: 43, maxLength: 43, pattern: "^[A-Za-z0-9_-]+$" })
  @IsString()
  @Length(43, 43)
  @Matches(/^[A-Za-z0-9_-]+$/)
  token!: string;

  @ApiProperty({ type: String, format: 'password', writeOnly: true, example: 'ExamplePassword123!' , minLength: 15, maxLength: 128 })
  @IsString()
  @Length(15, 128)
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ type: String, format: 'password', writeOnly: true, example: 'ExamplePassword123!' , minLength: 8, maxLength: 128 })
  @IsString()
  @Length(8, 128)
  currentPassword!: string;

  @ApiProperty({ type: String, format: 'password', writeOnly: true, example: 'ExamplePassword123!' , minLength: 15, maxLength: 128 })
  @IsString()
  @Length(15, 128)
  newPassword!: string;
}
