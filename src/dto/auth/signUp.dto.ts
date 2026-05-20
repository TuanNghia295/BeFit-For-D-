import { IsNotEmpty, IsString, MinLength } from 'class-validator';
export class SignUpDto {
  @IsString()
  @IsNotEmpty()
  readonly userName!: string;

  @IsNotEmpty()
  @IsString()
  readonly firstName!: string;

  @IsNotEmpty()
  @IsString()
  readonly lastName!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  readonly password!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  readonly confirmationPassword!: string;
}
