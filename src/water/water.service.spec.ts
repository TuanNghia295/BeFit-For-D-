import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma.service';
import { WaterService } from './water.service';

describe('WaterService', () => {
  let service: WaterService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
    waterLogs: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const req = { user: { sub: 1 } } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaterService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<WaterService>(WaterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('gets today water amount summary', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 1, target: 2000 });
    prismaMock.waterLogs.findMany.mockResolvedValue([{ amount: 500 }, { amount: 700 }]);

    const result = await service.getAmoutOfWater(req);

    expect(result.totalAmount).toBe(1200);
    expect(result.percentage).toBe(60);
    expect(result.count).toBe(2);
  });

  it('throws not found when user not found in list logs', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.getListWaterlogs(req, { page: 1, limit: 10 })
    ).rejects.toThrow(NotFoundException);
  });

  it('returns paginated water logs', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ target: 2000 });
    prismaMock.waterLogs.findMany.mockResolvedValue([
      { id: 1, amount: 500, createdAt: new Date('2026-05-01') },
    ]);
    prismaMock.waterLogs.count.mockResolvedValue(1);

    const result = await service.getListWaterlogs(req, { page: 1, limit: 10 });

    expect(result.data[0].percentage).toBe(25);
    expect(result.pagination.total).toBe(1);
  });

  it('returns internal error when update payload is invalid', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 1, target: 2000 });

    await expect(service.updateWaterlog(req, { id: '1' })).rejects.toThrow(
      InternalServerErrorException
    );
  });

  it('deletes water log successfully', async () => {
    prismaMock.waterLogs.findFirst.mockResolvedValue({ id: 1 });
    prismaMock.waterLogs.delete.mockResolvedValue({ id: 1 });

    const result = await service.deleteWaterlog(req, 1);

    expect(result).toEqual({ message: 'Deleted water log with id 1 successfully' });
  });

  it('throws conflict for invalid id in delete', async () => {
    await expect(service.deleteWaterlog(req, Number.NaN)).rejects.toThrow(
      ConflictException
    );
  });

  it('throws bad request for invalid date range in stats', async () => {
    await expect(
      service.getWaterStats(req, new Date('invalid-date'), new Date('2026-05-01'))
    ).rejects.toThrow(BadRequestException);
  });

  it('returns water statistics by range', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 1, target: 2000 });
    prismaMock.waterLogs.findMany.mockResolvedValue([
      { id: 1, amount: 500, createdAt: new Date('2026-05-01T08:00:00.000Z') },
      { id: 2, amount: 700, createdAt: new Date('2026-05-01T19:00:00.000Z') },
      { id: 3, amount: 800, createdAt: new Date('2026-05-02T08:00:00.000Z') },
    ]);

    const result = await service.getWaterStats(
      req,
      new Date('2026-05-01T00:00:00.000Z'),
      new Date('2026-05-02T23:59:59.000Z')
    );

    expect(result.totalAmount).toBe(2000);
    expect(result.totalLogs).toBe(3);
    expect(result.daily).toHaveLength(2);
    expect(result.percentage).toBe(100);
  });
});
