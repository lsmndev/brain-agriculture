import { ApiProperty } from '@nestjs/swagger';

import { State } from '@common/enums/state.enum.js';

export class FarmResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id: string;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  producerId: string;

  @ApiProperty({
    example: 'Green Valley Farm',
  })
  name: string;

  @ApiProperty({
    example: 'São Paulo',
  })
  city: string;

  @ApiProperty({
    enum: State,
    example: State.SP,
  })
  state: State;

  @ApiProperty({
    example: '1000.0000',
    description: 'Total farm area in hectares.',
  })
  totalArea: string;

  @ApiProperty({
    example: '750.0000',
    description: 'Arable area in hectares.',
  })
  arableArea: string;

  @ApiProperty({
    example: '250.0000',
    description: 'Vegetation area in hectares.',
  })
  vegetationArea: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-09-20T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    format: 'date-time',
    example: '2026-09-20T12:00:00.000Z',
  })
  updatedAt: Date;
}