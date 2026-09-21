import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CropsController } from './crops.controller.js';
import { CropsService } from './crops.service.js';
import { Crop } from './entities/crop.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Crop])],
  controllers: [CropsController],
  providers: [CropsService],
})
export class CropsModule {}
