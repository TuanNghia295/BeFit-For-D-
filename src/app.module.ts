import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WaterModule } from './water/water.module';

@Module({
  imports: [ScheduleModule.forRoot(), AuthModule, UserModule, WaterModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
