import { ApiProperty } from '@nestjs/swagger';

export class CropSeasonResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  id: string;

  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  farmId: string;

  @ApiProperty({
    example: '2026 Harvest',
  })
  name: string;

  @ApiProperty({
    example: 2026,
  })
  year: number;

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