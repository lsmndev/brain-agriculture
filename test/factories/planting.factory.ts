import { CreatePlantingDto } from '../../src/plantings/dto/create-planting.dto.js';
import { Planting } from '../../src/plantings/entities/planting.entity.js';

import { TEST_IDS } from '../fixtures/ids.fixture.js';

export function makePlanting(overrides: Partial<Planting> = {}): Planting {
  const now = new Date();

  return {
    id: TEST_IDS.planting,
    cropSeasonId: TEST_IDS.cropSeason,
    cropId: TEST_IDS.crop,
    plantedAreaHa: '50.0000',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as Planting;
}

export function makeCreatePlantingDto(overrides: Partial<CreatePlantingDto> = {}): CreatePlantingDto {
  return {
    cropSeasonId: TEST_IDS.cropSeason,
    cropId: TEST_IDS.crop,
    plantedAreaHa: '50',
    ...overrides,
  };
}
