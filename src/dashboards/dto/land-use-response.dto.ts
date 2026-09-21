import { ApiProperty } from '@nestjs/swagger';

export class LandUseResponseDto {
  @ApiProperty({
    example: '12350.5000',
    description: 'Total arable area in hectares.',
  })
  arableAreaHa: string;

  @ApiProperty({
    example: '6190.2500',
    description: 'Total vegetation area in hectares.',
  })
  vegetationAreaHa: string;
}