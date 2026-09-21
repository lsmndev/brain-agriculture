import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import { setupSwagger } from '@common/config/swagger.config.js';
import { createValidationPipe } from '@common/config/validation-pipe.config.js';
import { OtelLogger } from './common/logger/otel-logger.service.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(new OtelLogger());
  app.useGlobalPipes(createValidationPipe());
  app.use(helmet());

  const corsOrigins = process.env.CORS_ORIGIN
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins ?? [],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.enableShutdownHooks();

  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
