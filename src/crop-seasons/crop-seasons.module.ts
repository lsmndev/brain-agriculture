import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CropSeasonsController } from './crop-seasons.controller.js';
import { CropSeasonsService } from './crop-seasons.service.js';
import { CropSeason } from './entities/crop-season.entity.js';
import { Farm } from '@farms/entities/farm.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([CropSeason, Farm])],
  controllers: [CropSeasonsController],
  providers: [CropSeasonsService],
})
export class CropSeasonsModule {}
