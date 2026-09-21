import { DocumentType } from '../../src/common/enums/document-type.enum.js';
import { CreateProducerDto } from '../../src/producers/dto/create-producer.dto.js';
import { Producer } from '../../src/producers/entities/producer.entity.js';

import { TEST_IDS } from '../fixtures/ids.fixture.js';

export function makeProducer(overrides: Partial<Producer> = {}): Producer {
  const now = new Date();

  return {
    id: TEST_IDS.producer,
    document: '52998224725',
    documentType: DocumentType.CPF,
    name: 'John Doe',
    farms: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as Producer;
}

export function makeCreateProducerDto(overrides: Partial<CreateProducerDto> = {}): CreateProducerDto {
  return {
    document: '52998224725',
    documentType: DocumentType.CPF,
    name: 'John Doe',
    ...overrides,
  };
}
