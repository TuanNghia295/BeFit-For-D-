import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips out properties not in the DTO
      forbidNonWhitelisted: true, // Throws error if non-DTO properties exist
      transform: true, // Automatically transforms payloads to DTO instances
    })
  );
  await app.listen(process.env.PORT ?? 5001);
}
bootstrap();
