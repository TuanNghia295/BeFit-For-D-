import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
export class UpdateUserInfoDto {
  @IsString()
  @IsNotEmpty()
  readonly userName!: string;

  @IsNotEmpty()
  @IsString()
  readonly firstName!: string;

  @IsNotEmpty()
  @IsString()
  readonly lastName!: string;

  @IsOptional()
  @IsNumber()
  target?: number;

  @IsOptional()
  @IsString()
  @MinLength(6)
  readonly currentPassword!: string;

  @IsOptional()
  @IsString()
  readonly newPassword!: string;

  @IsOptional()
  @IsString()
  readonly confirmationPassword!: string;
}
