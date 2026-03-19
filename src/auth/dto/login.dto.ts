import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string | undefined;

  @IsString()
  @MinLength(8)
  password: string | undefined;
}
