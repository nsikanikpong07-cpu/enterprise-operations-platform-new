import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length } from "class-validator";

export class LoginDto {
  @ApiProperty({ type: String, format: 'email', example: 'person@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ type: String, format: 'password', writeOnly: true, example: 'ExamplePassword123!' , minLength: 8, maxLength: 128 })
  @IsString()
  @Length(8, 128)
  password!: string;
}
