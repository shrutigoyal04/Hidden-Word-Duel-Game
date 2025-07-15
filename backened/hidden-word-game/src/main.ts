import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  // Create a custom bootstrap logger
  const logger = new Logger('NestApplication');
  
  // Create the app with default logger
  const app = await NestFactory.create(AppModule, {
    // Don't disable the logger here
    logger: false,
  });

  app.enableCors({
    origin: '*',
  });

  app.useGlobalPipes(new ValidationPipe());

  // Use the logger to log startup messages
  console.log('Application is starting...');
  
  await app.listen(3000);
  
  // Log the startup message with the custom logger
  console.log(`🚀 Server started and listening on http://localhost:3000`);
}
bootstrap();