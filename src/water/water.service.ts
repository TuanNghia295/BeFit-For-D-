import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedRequest } from 'src/auth/auth.interface';
import { PaginationDto } from 'src/dto/pagination.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class WaterService {
  constructor(private readonly prisma: PrismaService) {}
  //  Get water log for today:
  async getAmoutOfWater(req: AuthenticatedRequest) {
    const { sub } = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const userInfo = await this.prisma.user.findUnique({
      where: { id: sub },
      select: { id: true, target: true },
    });

    if (!userInfo) throw new NotFoundException('User not found');

    // Lấy tất cả logs hôm nay và tính tổng
    const waterLogs = await this.prisma.waterLogs.findMany({
      where: {
        userId: sub,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalAmount = waterLogs.reduce((sum, log) => sum + log.amount, 0);
    const percentage = Math.round((totalAmount / userInfo.target) * 100);

    return {
      logs: waterLogs,
      totalAmount,
      target: userInfo.target,
      percentage,
      count: waterLogs.length,
    };
  }

  //   List amount of water users consume each day: /water/list
  async getListWaterlogs(req: AuthenticatedRequest, pagination: PaginationDto) {
    const { sub } = req.user;
    // pagination
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const userInfo = await this.prisma.user.findUnique({
      where: { id: sub },
      select: { target: true },
    });

    if (!userInfo) {
      throw new NotFoundException('User not found');
    }

    const [data, total] = await Promise.all([
      this.prisma.waterLogs.findMany({
        where: { userId: sub },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          createdAt: true,
        },
      }),
      this.prisma.waterLogs.count({ where: { userId: sub } }),
    ]);

    const dataWithPercentage = data.map(log => ({
      ...log,
      percentage: Math.round((log.amount / userInfo.target) * 100),
    }));

    return {
      data: dataWithPercentage,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }
}
