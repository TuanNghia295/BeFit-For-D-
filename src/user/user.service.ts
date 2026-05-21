import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from 'src/auth/auth.interface';
import { UpdateUserInfoDto } from 'src/dto/user/updateUserinfo.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(request: AuthenticatedRequest) {
    const { sub } = request.user;
    const userInfo = await this.prisma.user.findUnique({
      where: { id: sub },
      select: {
        displayName: true,
        userName: true,
        firstName: true,
        lastName: true,
        target: true,
      },
    });
    if (!userInfo) throw new NotFoundException('User not found');
    return { userInfo };
  }

  async update(body: UpdateUserInfoDto, request: AuthenticatedRequest) {
    const {
      userName,
      firstName,
      lastName,
      currentPassword,
      target,
      newPassword,
      confirmationPassword,
    } = body;

    const { sub } = request.user;

    const userInfo = await this.prisma.user.findUnique({
      where: { id: sub },
    });

    if (!userInfo) {
      throw new NotFoundException('User not found');
    }

    if (newPassword && confirmationPassword) {
      if (newPassword !== confirmationPassword) {
        throw new ConflictException('Password not match, please try again');
      }

      const isValidPass = await bcrypt.compare(
        currentPassword,
        userInfo.hashedPassword
      );
      if (!isValidPass) {
        throw new ConflictException('Current password is incorrect');
      }
    }

    // Only hash if password is provided
    const newPass = newPassword
      ? await bcrypt.hash(newPassword, 10)
      : userInfo.hashedPassword;

    // Correct string concatenation
    const updateUserinfo = await this.prisma.user.update({
      where: { id: sub },
      data: {
        displayName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        userName,
        target,
        hashedPassword: newPass,
      },
      select: {
        id: true,
        userName: true,
        displayName: true,
        firstName: true,
        lastName: true,
        target: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: 'Update successfully',
      data: updateUserinfo,
    };
  }
}
