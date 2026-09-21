import { ApiProperty } from '@nestjs/swagger';

export class PlantingResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  id: string;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  cropSeasonId: string;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  cropId: string;

  @ApiProperty({
    example: '500.0000',
    description: 'Planted area in hectares.',
  })
  plantedAreaHa: string;

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