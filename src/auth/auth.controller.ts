import { Body, Controller, Post, Res } from '@nestjs/common';
import { SignUpDto } from 'src/dto/auth/signUp.dto';
import { PrismaService } from 'src/prisma.service';
import { AuthService } from './auth.service';
import { SignInDto } from 'src/dto/auth/signIn.dto';
import type { Response } from 'express';

@Controller('/auth')
export class AuthController {
  constructor(
    private prisma: PrismaService,
    private AuthService: AuthService
  ) {}
  @Post('/signup')
  SignUp(@Body() signUpDto: SignUpDto) {
    return this.AuthService.SignUp(signUpDto);
  }

  @Post('/signin')
  SignIn(@Body() signInDto: SignInDto, @Res() res: Response) {
    return this.AuthService.SignIn(signInDto, res);
  }

  @Post('/logout')
  Logout(@Res() res: Response) {
    return this.AuthService.Logout(res);
  }

  @Post()
  Refresh() {
    return [];
  }
}
