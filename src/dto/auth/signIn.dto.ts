import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignInDto {
  @IsString()
  @IsNotEmpty()
  readonly userName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  readonly password!: string;
}
