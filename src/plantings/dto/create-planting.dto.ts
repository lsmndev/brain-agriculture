import { IsUUID } from 'class-validator';

import { IsDecimalString } from '@common/decorators/is-decimal-string.decorator.js';

export class CreatePlantingDto {
  @IsUUID()
  cropSeasonId: string;

  @IsUUID()
  cropId: string;

  @IsDecimalString()
  plantedAreaHa: string;
}
