import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({
    summary: 'Check application health',
  })
  @ApiOkResponse({
    description: 'Application and database are healthy.',
    schema: {
      example: {
        status: 'ok',
        database: 'up',
      },
    },
  })
  async check() {
    try {
      await this.dataSource.query('SELECT 1');

      return {
        status: 'ok',
        database: 'up',
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
      });
    }
  }
}