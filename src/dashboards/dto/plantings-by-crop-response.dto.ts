import { ApiProperty } from '@nestjs/swagger';

export class PlantingsByCropResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  cropId: string;

  @ApiProperty({
    example: 'Soybean',
  })
  cropName: string;

  @ApiProperty({
    example: 8,
    description: 'Number of plantings for the crop.',
  })
  totalPlantings: number;

  @ApiProperty({
    example: '3100.7500',
    description: 'Total planted area in hectares.',
  })
  plantedAreaHa: string;
}