import { Body, Controller, Post } from '@nestjs/common';
import { SignUpDto } from 'src/dto/auth/signUp.dto';
import { PrismaService } from 'src/prisma.service';
import { AuthService } from './auth.service';

@Controller('/api/auth')
export class AuthController {
  constructor(
    private prisma: PrismaService,
    private AuthService: AuthService
  ) {}
  @Post()
  SignUp(@Body() signUpDto: SignUpDto) {
    return this.AuthService.SignUp(signUpDto);
  }

  @Post()
  SignIn() {
    return [];
  }

  @Post()
  Logout() {
    return [];
  }

  @Post()
  Refresh() {
    return [];
  }
}
