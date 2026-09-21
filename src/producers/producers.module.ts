import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProducersService } from './producers.service.js';
import { ProducersController } from './producers.controller.js';
import { Producer } from './entities/producer.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Producer])],
  controllers: [ProducersController],
  providers: [ProducersService],
  exports: [ProducersService],
})
export class ProducersModule {}
