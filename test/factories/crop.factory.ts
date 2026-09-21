import { CreateCropDto } from '../../src/crops/dto/create-crop.dto.js';
import { Crop } from '../../src/crops/entities/crop.entity.js';

import { TEST_IDS } from '../fixtures/ids.fixture.js';

export function makeCrop(overrides: Partial<Crop> = {}): Crop {
  const now = new Date();

  return {
    id: TEST_IDS.crop,
    name: 'Soybean',
    plantings: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as Crop;
}

export function makeCreateCropDto(overrides: Partial<CreateCropDto> = {}): CreateCropDto {
  return {
    name: 'Soybean',
    ...overrides,
  };
}
