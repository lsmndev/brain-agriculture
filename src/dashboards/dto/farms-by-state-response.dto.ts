import { ApiProperty } from '@nestjs/swagger';

import { State } from '@common/enums/state.enum.js';

export class FarmsByStateResponseDto {
  @ApiProperty({
    enum: State,
    example: State.SP,
  })
  state: string;

  @ApiProperty({
    example: 5,
    description: 'Number of farms in the state.',
  })
  total: number;
}