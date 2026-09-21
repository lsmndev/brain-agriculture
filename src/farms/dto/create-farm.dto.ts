import { IsEnum, IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

import { State } from '@common/enums/state.enum.js';
import { IsDecimalString } from '@common/decorators/is-decimal-string.decorator.js';

export class CreateFarmDto {
  @IsUUID()
  producerId: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  city: string;

  @IsEnum(State)
  state: State;

  @IsDecimalString()
  totalArea: string;

  @IsDecimalString()
  arableArea: string;

  @IsDecimalString()
  vegetationArea: string;
}
