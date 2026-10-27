
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Enterprise Operations API')
    .setDescription(
      'API documentation for the Enterprise Operations Platform',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // Generate OpenAPI documentation
  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI endpoint
  SwaggerModule.setup('api', app, document);

  // Start application
  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
