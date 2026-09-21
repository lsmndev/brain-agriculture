import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { HealthModule } from './health/health.module.js';
import { ProducersModule } from './producers/producers.module.js';
import { FarmsModule } from './farms/farms.module.js';
import { CropSeasonsModule } from './crop-seasons/crop-seasons.module.js';
import { CropsModule } from './crops/crops.module.js';
import { PlantingsModule } from './plantings/plantings.module.js';
import { DashboardsModule } from './dashboards/dashboards.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: Number(process.env.RATE_LIMIT_TTL_MS ?? 60000),
          limit: Number(process.env.RATE_LIMIT_MAX ?? 100),
        },
      ],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
      applicationName:
        process.env.DB_APPLICATION_NAME ?? 'brain-agriculture',
      poolSize: Number(
        process.env.DB_POOL_MAX ?? 10,
      ),
      ssl:
        process.env.DB_SSL === 'true'
          ? {
              rejectUnauthorized: true,
            }
          : false,
      extra: {
        idleTimeoutMillis: Number(
          process.env.DB_POOL_IDLE_TIMEOUT_MS ?? 30000,
        ),

        connectionTimeoutMillis: Number(
          process.env.DB_CONNECTION_TIMEOUT_MS ?? 5000,
        ),

        statement_timeout: Number(
          process.env.DB_STATEMENT_TIMEOUT_MS ?? 30000,
        ),
      },
    }),
    HealthModule,
    ProducersModule,
    FarmsModule,
    CropSeasonsModule,
    CropsModule,
    PlantingsModule,
    DashboardsModule,
  ],
  providers: [
  {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },
],
})
export class AppModule {}
