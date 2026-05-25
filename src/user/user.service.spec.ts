import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma.service';
import { UserService } from './user.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const bcryptMock = jest.requireMock('bcrypt') as {
  hash: jest.Mock;
  compare: jest.Mock;
};

describe('UserService', () => {
  let service: UserService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const req = { user: { sub: 1 } } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns current user profile', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ userName: 'john' });

    const result = await service.getMe(req);

    expect(result).toEqual({ userInfo: { userName: 'john' } });
  });

  it('throws not found when user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(service.getMe(req)).rejects.toThrow(NotFoundException);
  });

  it('throws conflict when new password and confirmation mismatch', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ hashedPassword: 'h' });

    await expect(
      service.update(
        {
          userName: 'john',
          firstName: 'John',
          lastName: 'Doe',
          currentPassword: 'x',
          newPassword: 'a',
          confirmationPassword: 'b',
          target: 2000,
        },
        req
      )
    ).rejects.toThrow(ConflictException);
  });

  it('updates profile successfully', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ hashedPassword: 'old-hash' });
    prismaMock.user.update.mockResolvedValue({ id: 1, userName: 'john' });

    const result = await service.update(
      {
        userName: 'john',
        firstName: 'John',
        lastName: 'Doe',
        currentPassword: undefined,
        newPassword: undefined,
        confirmationPassword: undefined,
        target: 2200,
      },
      req
    );

    expect(result.success).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it('validates current password when changing password', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ hashedPassword: 'old-hash' });
    bcryptMock.compare.mockResolvedValue(false);

    await expect(
      service.update(
        {
          userName: 'john',
          firstName: 'John',
          lastName: 'Doe',
          currentPassword: 'wrong',
          newPassword: 'newpass',
          confirmationPassword: 'newpass',
          target: 2200,
        },
        req
      )
    ).rejects.toThrow(new ConflictException('Current password is incorrect'));
  });
});
