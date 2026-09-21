import { State } from '../../src/common/enums/state.enum.js';
import { CreateFarmDto } from '../../src/farms/dto/create-farm.dto.js';
import { Farm } from '../../src/farms/entities/farm.entity.js';

import { TEST_IDS } from '../fixtures/ids.fixture.js';

export function makeFarm(overrides: Partial<Farm> = {}): Farm {
  const now = new Date();

  return {
    id: TEST_IDS.farm,
    producerId: TEST_IDS.producer,
    name: 'Green Valley Farm',
    city: 'Santos',
    state: State.SP,
    totalArea: '1000.0000',
    arableArea: '700.0000',
    vegetationArea: '300.0000',
    cropSeasons: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as Farm;
}

export function makeCreateFarmDto(overrides: Partial<CreateFarmDto> = {}): CreateFarmDto {
  return {
    producerId: TEST_IDS.producer,
    name: 'Green Valley Farm',
    city: 'Santos',
    state: State.SP,
    totalArea: '1000',
    arableArea: '700',
    vegetationArea: '300',
    ...overrides,
  };
}
