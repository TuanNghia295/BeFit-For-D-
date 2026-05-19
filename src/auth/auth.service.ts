import { Injectable } from '@nestjs/common';
import { SignUpDto } from 'src/dto/auth/signUp.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  SignUp(body: SignUpDto) {
    const {
      userName,
      displayName,
      firstName,
      lastName,
      password,
      confirmationPassword,
    } = body;

    return [];
  }
}
