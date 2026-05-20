import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SignUpDto } from 'src/dto/auth/signUp.dto';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';
import { SignInDto } from 'src/dto/auth/signIn.dto';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
type BcryptHashFn = (data: string, saltOrRounds: number) => Promise<string>;
type BcryptCompareFn = (data: string, encrypted: string) => Promise<boolean>;

const saltRound = 10;
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService
  ) {}

  async SignUp(body: SignUpDto) {
    try {
      const { userName, firstName, lastName, password, confirmationPassword } =
        body;

      const userExist = await this.prisma.user.findUnique({
        where: { userName },
      });

      if (userExist) {
        throw new HttpException('User already exist', HttpStatus.CONFLICT);
      }

      if (password !== confirmationPassword) {
        throw new HttpException(
          'Password not match',
          HttpStatus.CONTENT_DIFFERENT
        );
      }

      const displayName = firstName + lastName;
      const hashedPassword = await this.hash(password, saltRound);

      const newUser = await this.prisma.user.create({
        data: {
          displayName,
          userName,
          firstName,
          lastName,
          hashedPassword,
        },
      });

      if (!newUser) {
        throw new InternalServerErrorException();
      }

      return {
        message: newUser,
      };
    } catch {
      throw new HttpException(
        'Failed when signup user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async SignIn(body: SignInDto, res: Response) {
    try {
      const { userName, password } = body;
      const userExist = await this.prisma.user.findUnique({
        where: { userName },
      });

      if (!userExist) {
        throw new NotFoundException();
      }

      const bcryptCompare = (bcrypt as unknown as { compare: BcryptCompareFn })
        .compare;
      const isValidPassword: boolean = await bcryptCompare(
        password,
        userExist.hashedPassword
      );

      if (!isValidPassword) {
        throw new ConflictException('Password not match');
      }
      const accessPayloads = {
        sub: userExist.id,
        userName: userExist.userName,
        type: 'access',
      };

      const refreshPayloads = {
        sub: userExist.id,
        userName: userExist.userName,
        type: 'refresh',
      };
      const accessToken = this.jwt.sign(accessPayloads);
      const refreshToken = this.jwt.sign(refreshPayloads, {
        expiresIn: '7d',
      });
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);
      // hash refreshToken
      const hashedRefreshToken = await this.hash(refreshToken, saltRound);

      // Save RefreshToken into DB
      await this.prisma.refreshToken.create({
        data: {
          token: hashedRefreshToken,
          expire: expires,
          userId: userExist.id,
        },
      });

      // Send refresh token to client by cookie
      const cookiesOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires,
        sameSite: 'strict' as const,
      };

      res.cookie('refreshToken', hashedRefreshToken, cookiesOptions);

      return res.json({ accessToken });
    } catch (e) {
      console.log('EERR', e);

      throw new HttpException(
        'Failed when signin user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  Logout(res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.json({ message: 'Logout successfully' });
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async removeExpiredRefreshTokens() {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expire: {
          lt: new Date(),
        },
      },
    });
  }

  private async hash(password: string, saltRound: number): Promise<string> {
    const bcryptHash = (bcrypt as unknown as { hash: BcryptHashFn }).hash;
    return await bcryptHash(password, saltRound);
  }
}
