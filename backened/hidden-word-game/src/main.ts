import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend to connect
  app.enableCors({
    origin: '*', // For development, allow any origin. For production, restrict this to your frontend's domain.
  });

  // Use a global validation pipe to automatically validate DTOs
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
}
bootstrap();
