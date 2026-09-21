import { CreateCropSeasonDto } from '../../src/crop-seasons/dto/create-crop-season.dto.js';
import { CropSeason } from '../../src/crop-seasons/entities/crop-season.entity.js';

import { TEST_IDS } from '../fixtures/ids.fixture.js';

export function makeCropSeason(overrides: Partial<CropSeason> = {}): CropSeason {
  const now = new Date();

  return {
    id: TEST_IDS.cropSeason,
    farmId: TEST_IDS.farm,
    name: 'Safra 2026',
    year: 2026,
    plantings: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as CropSeason;
}

export function makeCreateCropSeasonDto(overrides: Partial<CreateCropSeasonDto> = {}): CreateCropSeasonDto {
  return {
    farmId: TEST_IDS.farm,
    name: 'Safra 2026',
    year: 2026,
    ...overrides,
  };
}
