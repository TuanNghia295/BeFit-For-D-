import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from 'src/auth/auth.guard';
import { WaterService } from './water.service';
import { WaterController } from './water.controller';

describe('WaterController', () => {
  let controller: WaterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WaterController],
      providers: [
        {
          provide: WaterService,
          useValue: {
            getAmoutOfWater: jest.fn(),
            getListWaterlogs: jest.fn(),
            updateWaterlog: jest.fn(),
            deleteWaterlog: jest.fn(),
            getWaterStats: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<WaterController>(WaterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
