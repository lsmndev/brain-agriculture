import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Farm } from '../farms/entities/farm.entity.js';

import { DashboardsController } from './dashboards.controller.js';
import { DashboardsService } from './dashboards.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Farm]),
  ],
  controllers: [DashboardsController],
  providers: [DashboardsService],
})
export class DashboardsModule {}