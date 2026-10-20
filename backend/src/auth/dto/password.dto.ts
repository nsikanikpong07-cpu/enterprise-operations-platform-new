import { IsEmail, IsString, Length, Matches, MaxLength } from "class-validator";

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @Length(43, 43)
  @Matches(/^[A-Za-z0-9_-]+$/)
  token!: string;

  @IsString()
  @Length(15, 128)
  newPassword!: string;
}

export class ChangePasswordDto {
  @IsString()
  @Length(8, 128)
  currentPassword!: string;

  @IsString()
  @Length(15, 128)
  newPassword!: string;
}
