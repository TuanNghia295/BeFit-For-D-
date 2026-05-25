import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from 'src/auth/auth.interface';
import { PaginationDto } from 'src/dto/pagination.dto';
import { PrismaService } from 'src/prisma.service';

export interface WaterLogResponse {
  id: number;
  amount: number;
  percentage: number;
  createdAt: Date;
}

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

  // Update water log
  async updateWaterlog(
    req: AuthenticatedRequest,
    query: { id?: string; amount?: string | number }
  ) {
    try {
      const { sub } = req.user;
      const userInfo = await this.prisma.user.findUnique({
        where: { id: sub },
        select: { id: true, target: true },
      });

      if (!userInfo) throw new NotFoundException('User not found');

      const waterLogId = Number(query.id);
      const amount = Number(query.amount);

      if (!query.id || Number.isNaN(waterLogId)) {
        throw new ConflictException('Valid id is required');
      }

      if (!query.amount || Number.isNaN(amount) || amount <= 0) {
        throw new ConflictException('Valid amount is required');
      }

      const existedLog = await this.prisma.waterLogs.findFirst({
        where: { id: waterLogId, userId: sub },
        select: { id: true },
      });

      if (!existedLog) throw new NotFoundException('Water log not found');

      const updated = await this.prisma.waterLogs.update({
        where: { id: waterLogId },
        data: { amount },
        select: { id: true, amount: true, createdAt: true },
      });

      return {
        ...updated,
        percentage: Math.round((updated.amount / userInfo.target) * 100),
      };
    } catch (error) {
      console.error('Failed when update waterlog', error);
      throw new InternalServerErrorException();
    }
  }

  async getWaterStats(
    req: AuthenticatedRequest,
    startDate: Date,
    endDate: Date
  ) {
    const { sub } = req.user;

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate > endDate
    ) {
      throw new BadRequestException('Invalid date range');
    }

    const userInfo = await this.prisma.user.findUnique({
      where: { id: sub },
      select: { id: true, target: true },
    });

    if (!userInfo) throw new NotFoundException('User not found');

    const logs = await this.prisma.waterLogs.findMany({
      where: {
        userId: sub,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, amount: true, createdAt: true },
    });

    const totalAmount = logs.reduce((sum, log) => sum + log.amount, 0);
    const totalLogs = logs.length;

    const groupedByDate = logs.reduce(
      (acc, log) => {
        const key = log.createdAt.toISOString().split('T')[0];
        acc[key] = (acc[key] ?? 0) + log.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    const daily = Object.entries(groupedByDate).map(([date, amount]) => ({
      date,
      amount,
      percentage: Math.round((amount / userInfo.target) * 100),
    }));

    return {
      startDate,
      endDate,
      totalAmount,
      totalLogs,
      averageAmountPerLog: totalLogs ? Math.round(totalAmount / totalLogs) : 0,
      percentage: Math.round((totalAmount / userInfo.target) * 100),
      daily,
    };
  }

  async deleteWaterlog(req: AuthenticatedRequest, id: number) {
    try {
      const { sub } = req.user;
      if (Number.isNaN(id)) {
        throw new ConflictException('Waterlog id is required');
      }

      const existedLog = await this.prisma.waterLogs.findFirst({
        where: { id, userId: sub },
        select: { id: true },
      });

      if (!existedLog) throw new NotFoundException('Water log not found');

      await this.prisma.waterLogs.delete({
        where: { id },
      });

      return {
        message: `Deleted water log with id ${id} successfully`,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('Failed when delete waterlog', error);
      throw new InternalServerErrorException();
    }
  }
}
