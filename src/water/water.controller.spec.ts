import { Test, TestingModule } from '@nestjs/testing';
import { WaterController } from './water.controller';

describe('WaterController', () => {
  let controller: WaterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WaterController],
    }).compile();

    controller = module.get<WaterController>(WaterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
