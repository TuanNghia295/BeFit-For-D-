import { Module } from '@nestjs/common';
import { WaterService } from './water.service';
import { WaterController } from './water.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [WaterService, PrismaService],
  controllers: [WaterController],
})
export class WaterModule {}
