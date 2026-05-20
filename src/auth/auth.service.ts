import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SignUpDto } from 'src/dto/auth/signUp.dto';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';

type BcryptHashFn = (data: string, saltOrRounds: number) => Promise<string>;
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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
      const saltRound = 10;
      const bcryptHash = (bcrypt as unknown as { hash: BcryptHashFn }).hash;
      const hashedPassword = await bcryptHash(password, saltRound);

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
}
