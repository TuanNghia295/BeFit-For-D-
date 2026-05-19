import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignIn {
  @IsString()
  @IsNotEmpty()
  readonly userName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  readonly password!: string;
}
