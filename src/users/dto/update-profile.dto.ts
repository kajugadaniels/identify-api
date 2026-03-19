import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

// All fields are optional — user can update one or all at once
// We use IsOptional() so fields not sent are simply ignored
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(50)
  lastName?: string;
}
