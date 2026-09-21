import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FarmsService } from './farms.service.js';
import { FarmsController } from './farms.controller.js';
import { Farm } from './entities/farm.entity.js';
import { Producer } from '@producers/entities/producer.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Farm, Producer])],
  controllers: [FarmsController],
  providers: [FarmsService],
})
export class FarmsModule {}
