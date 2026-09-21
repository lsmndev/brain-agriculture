import { ApiProperty } from '@nestjs/swagger';

export class DashboardTotalsResponseDto {
  @ApiProperty({
    example: 12,
    description: 'Total number of farms.',
  })
  totalFarms: number;

  @ApiProperty({
    example: '18540.7500',
    description: 'Total farm area in hectares.',
  })
  totalHectares: string;
}