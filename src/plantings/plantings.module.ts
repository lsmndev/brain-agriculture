import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PlantingsService } from './plantings.service.js';
import { PlantingsController } from './plantings.controller.js';
import { Planting } from './entities/planting.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Planting])],
  controllers: [PlantingsController],
  providers: [PlantingsService],
})
export class PlantingsModule {}
