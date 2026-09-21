import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  if (process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Brain Agriculture API')
      .setDescription('API for managing rural producers, farms, crop seasons, crops, plantings and agricultural dashboards.')
      .setVersion('1.0')
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('docs', app, documentFactory, {
      customSiteTitle: 'Brain Agriculture API',
    });
  }
}
