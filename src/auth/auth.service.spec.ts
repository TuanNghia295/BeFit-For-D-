import { HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const bcryptMock = jest.requireMock('bcrypt') as {
  hash: jest.Mock;
  compare: jest.Mock;
};

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const jwtMock = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('signs up user successfully', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    bcryptMock.hash.mockResolvedValue('hashed-pass');
    prismaMock.user.create.mockResolvedValue({ id: 1, userName: 'john' });

    const result = await service.SignUp({
      userName: 'john',
      firstName: 'John',
      lastName: 'Doe',
      password: '123456',
      confirmationPassword: '123456',
    });

    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(result).toEqual({ message: { id: 1, userName: 'john' } });
  });

  it('returns internal error when sign in fails', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.SignIn(
        { userName: 'missing', password: '123456' },
        { cookie: jest.fn(), json: jest.fn() } as any
      )
    ).rejects.toThrow(
      new HttpException('Failed when signin user', HttpStatus.INTERNAL_SERVER_ERROR)
    );
  });

  it('signs in successfully and sets cookie', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 7,
      userName: 'john',
      hashedPassword: 'hashed-pass',
    });
    bcryptMock.compare.mockResolvedValue(true);
    bcryptMock.hash.mockResolvedValue('hashed-refresh');
    jwtMock.sign
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');

    const res = {
      cookie: jest.fn(),
      json: jest.fn().mockReturnValue({ accessToken: 'access-token' }),
    } as any;

    const result = await service.SignIn(
      { userName: 'john', password: '123456' },
      res
    );

    expect(prismaMock.refreshToken.create).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ accessToken: 'access-token' });
    expect(result).toEqual({ accessToken: 'access-token' });
  });

  it('refreshes access token from cookie', () => {
    jwtMock.sign.mockReturnValue('new-access-token');

    const result = service.Refresh({ cookies: { refreshToken: 'rt' } } as any);

    expect(result).toEqual({ accessToken: 'new-access-token' });
  });

  it('clears refresh cookie on logout', () => {
    const res = {
      clearCookie: jest.fn(),
      json: jest.fn().mockReturnValue({ message: 'Logout successfully' }),
    } as any;

    const result = service.Logout(res);

    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
    expect(result).toEqual({ message: 'Logout successfully' });
  });
});
