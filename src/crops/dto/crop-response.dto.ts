import { ApiProperty } from '@nestjs/swagger';

export class CropResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  id: string;

  @ApiProperty({
    example: 'Soybean',
  })
  name: string;

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