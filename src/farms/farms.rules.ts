import { BadRequestException } from '@nestjs/common';

import { decimalToBigInt } from '@common/utils/decimal.util.js';

export function validateFarmAreas(totalArea: string, arableArea: string, vegetationArea: string): void {
  const total = decimalToBigInt(totalArea);
  const arable = decimalToBigInt(arableArea);
  const vegetation = decimalToBigInt(vegetationArea);

  if (total <= 0n) {
    throw new BadRequestException('Total area must be greater than zero');
  }

  if (arable < 0n) {
    throw new BadRequestException('Arable area cannot be negative');
  }

  if (vegetation < 0n) {
    throw new BadRequestException('Vegetation area cannot be negative');
  }

  if (arable + vegetation > total) {
    throw new BadRequestException('Arable area plus vegetation area cannot exceed total area');
  }
}
