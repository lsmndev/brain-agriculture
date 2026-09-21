import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { beforeEach, describe, expect, it } from 'vitest';

import { Planting } from '@plantings/entities/planting.entity.js';
import { Producer } from '@producers/entities/producer.entity.js';
import { makeForeignKeyViolationError } from '@tests/factories/database-error.factory.js';
import { makeFarm } from '@tests/factories/farm.factory.js';
import { makeProducer } from '@tests/factories/producer.factory.js';
import { TEST_IDS } from '@tests/fixtures/ids.fixture.js';
import { makeQueryBuilderMock, type MockQueryBuilder } from '@tests/mocks/query-builder.mock.js';
import { makeRepositoryMock, type MockRepository } from '@tests/mocks/repository.mock.js';
import { makeTransactionMock } from '@tests/mocks/typeorm-transaction.mock.js';

import { Farm } from './entities/farm.entity.js';
import { FarmsService } from './farms.service.js';

const FARM_ID = TEST_IDS.farm;
const PRODUCER_ID = TEST_IDS.producer;
const OTHER_PRODUCER_ID = '22222222-2222-4222-8222-222222222222';

const CREATE_DTO = {
  producerId: PRODUCER_ID,
  name: 'Green Farm',
  city: 'Campinas',
  state: 'SP',
  totalArea: '100',
  arableArea: '60',
  vegetationArea: '40',
} as const;

describe('FarmsService', () => {
  let service: FarmsService;

  let farmRepository: MockRepository;
  let producerRepository: MockRepository;
  let txFarmRepository: MockRepository;
  let txProducerRepository: MockRepository;
  let plantingRepository: MockRepository;

  let farmQuery: MockQueryBuilder;
  let plantingQuery: MockQueryBuilder;

  function makeExistingFarm(overrides: Partial<Farm> = {}): Farm {
    return makeFarm({
      id: FARM_ID,
      producerId: PRODUCER_ID,
      totalArea: '100.0000',
      arableArea: '60.0000',
      vegetationArea: '40.0000',
      ...overrides,
    });
  }

  function prepareUpdate(farm = makeExistingFarm()): Farm {
    farmQuery.getOne.mockResolvedValue(farm);
    txFarmRepository.save.mockImplementation(async (entity) => entity);

    return farm;
  }

  function mockGreatestPlantedArea(total?: string): void {
    plantingQuery.getRawOne.mockResolvedValue(total === undefined ? undefined : { total });
  }

  beforeEach(async () => {
    farmRepository = makeRepositoryMock<Farm>();
    producerRepository = makeRepositoryMock<Producer>();

    txFarmRepository = makeRepositoryMock<Farm>();
    txProducerRepository = makeRepositoryMock<Producer>();
    plantingRepository = makeRepositoryMock<Planting>();

    farmQuery = makeQueryBuilderMock();
    plantingQuery = makeQueryBuilderMock();

    txFarmRepository.createQueryBuilder.mockReturnValue(farmQuery);
    plantingRepository.createQueryBuilder.mockReturnValue(plantingQuery);

    const transaction = makeTransactionMock([
      [Farm, txFarmRepository],
      [Producer, txProducerRepository],
      [Planting, plantingRepository],
    ]);

    const module = await Test.createTestingModule({
      providers: [
        FarmsService,
        {
          provide: getRepositoryToken(Farm),
          useValue: farmRepository,
        },
        {
          provide: getRepositoryToken(Producer),
          useValue: producerRepository,
        },
        {
          provide: DataSource,
          useValue: transaction.dataSource,
        },
      ],
    }).compile();

    service = module.get(FarmsService);
  });

  describe('create', () => {
    beforeEach(() => {
      producerRepository.findOne.mockResolvedValue(makeProducer({ id: PRODUCER_ID }));
    });

    it('should create a farm with normalized areas', async () => {
      const farm = makeExistingFarm({
        name: CREATE_DTO.name,
        city: CREATE_DTO.city,
        state: CREATE_DTO.state,
      });

      farmRepository.create.mockReturnValue(farm);
      farmRepository.save.mockResolvedValue(farm);

      const result = await service.create(CREATE_DTO);

      expect(result).toBe(farm);
      expect(producerRepository.findOne).toHaveBeenCalledWith({ where: { id: PRODUCER_ID } });
      expect(farmRepository.create).toHaveBeenCalledWith({
        ...CREATE_DTO,
        totalArea: '100.0000',
        arableArea: '60.0000',
        vegetationArea: '40.0000',
      });
      expect(farmRepository.save).toHaveBeenCalledWith(farm);
    });

    it('should reject a nonexistent producer', async () => {
      producerRepository.findOne.mockResolvedValue(null);

      await expect(service.create(CREATE_DTO)).rejects.toThrow(NotFoundException);
      expect(farmRepository.create).not.toHaveBeenCalled();
      expect(farmRepository.save).not.toHaveBeenCalled();
    });

    it.each([
      ['zero total area', { totalArea: '0', arableArea: '0', vegetationArea: '0' }],
      ['negative arable area', { arableArea: '-1' }],
      ['negative vegetation area', { vegetationArea: '-1' }],
      ['land use greater than total area', { arableArea: '70', vegetationArea: '40' }],
    ])('should reject %s', async (_, overrides) => {
      await expect(
        service.create({
          ...CREATE_DTO,
          ...overrides,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(farmRepository.save).not.toHaveBeenCalled();
    });

    it('should convert foreign key violation into ConflictException', async () => {
      farmRepository.create.mockReturnValue(makeExistingFarm());
      farmRepository.save.mockRejectedValue(makeForeignKeyViolationError());

      await expect(service.create(CREATE_DTO)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return farms ordered by creation date descending', async () => {
      const farms = [makeExistingFarm()];

      farmRepository.find.mockResolvedValue(farms);

      await expect(service.findAll()).resolves.toBe(farms);
      expect(farmRepository.find).toHaveBeenCalledWith({
        order: {
          createdAt: 'DESC',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a farm', async () => {
      const farm = makeExistingFarm();

      farmRepository.findOne.mockResolvedValue(farm);

      await expect(service.findOne(FARM_ID)).resolves.toBe(farm);
      expect(farmRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: FARM_ID,
        },
      });
    });

    it('should throw when farm does not exist', async () => {
      farmRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(FARM_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a farm with pessimistic lock', async () => {
      const farm = prepareUpdate(makeExistingFarm({ name: 'Old Farm' }));

      const result = await service.update(FARM_ID, {
        name: 'Updated Farm',
      });

      expect(farmQuery.where).toHaveBeenCalledWith('farm.id = :id', { id: FARM_ID });
      expect(farmQuery.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(txFarmRepository.merge).toHaveBeenCalledWith(farm, { name: 'Updated Farm' });
      expect(txFarmRepository.save).toHaveBeenCalledWith(farm);
      expect(result.name).toBe('Updated Farm');
    });

    it('should normalize updated areas', async () => {
      const farm = prepareUpdate();

      const result = await service.update(FARM_ID, {
        totalArea: '120',
        arableArea: '70',
        vegetationArea: '50',
      });

      expect(txFarmRepository.merge).toHaveBeenCalledWith(farm, {
        totalArea: '120.0000',
        arableArea: '70.0000',
        vegetationArea: '50.0000',
      });
      expect(result.totalArea).toBe('120.0000');
      expect(result.arableArea).toBe('70.0000');
      expect(result.vegetationArea).toBe('50.0000');
    });

    it('should return without saving when nothing changes', async () => {
      const farm = prepareUpdate(makeExistingFarm({ name: 'Green Farm' }));

      const result = await service.update(FARM_ID, {
        name: farm.name,
      });

      expect(result).toBe(farm);
      expect(txFarmRepository.merge).not.toHaveBeenCalled();
      expect(txFarmRepository.save).not.toHaveBeenCalled();
    });

    it('should throw when farm does not exist', async () => {
      farmQuery.getOne.mockResolvedValue(null);

      await expect(
        service.update(FARM_ID, {
          name: 'Updated Farm',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(txFarmRepository.save).not.toHaveBeenCalled();
    });

    it.each([
      ['zero total area', { totalArea: '0' }],
      ['negative arable area', { arableArea: '-1' }],
      ['negative vegetation area', { vegetationArea: '-1' }],
      ['land use greater than total area', { arableArea: '70' }],
    ])('should reject %s during update', async (_, changes) => {
      prepareUpdate();

      await expect(service.update(FARM_ID, changes)).rejects.toThrow(BadRequestException);
      expect(txFarmRepository.save).not.toHaveBeenCalled();
    });

    it.each([
      ['smaller than greatest planted area', '45.0000'],
      ['equal to greatest planted area', '50.0000'],
      ['missing planted area', undefined],
    ])('should allow reducing arable area when planted area is %s', async (_, plantedArea) => {
      prepareUpdate();
      mockGreatestPlantedArea(plantedArea);

      const result = await service.update(FARM_ID, {
        arableArea: '50',
      });

      expect(plantingRepository.createQueryBuilder).toHaveBeenCalledWith('planting');
      expect(plantingQuery.innerJoin).toHaveBeenCalledWith('planting.cropSeason', 'cropSeason');
      expect(plantingQuery.where).toHaveBeenCalledWith('cropSeason.farmId = :farmId', { farmId: FARM_ID });
      expect(result.arableArea).toBe('50.0000');
    });

    it('should reject reducing arable area below greatest planted area', async () => {
      prepareUpdate();
      mockGreatestPlantedArea('50.0001');

      await expect(
        service.update(FARM_ID, {
          arableArea: '50',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(txFarmRepository.save).not.toHaveBeenCalled();
    });

    it('should not query plantings when arable area does not decrease', async () => {
      prepareUpdate();

      await service.update(FARM_ID, {
        arableArea: '70',
        totalArea: '110',
      });

      expect(plantingRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should validate a new producer when producer changes', async () => {
      prepareUpdate();
      txProducerRepository.findOne.mockResolvedValue(makeProducer({ id: OTHER_PRODUCER_ID }));

      const result = await service.update(FARM_ID, {
        producerId: OTHER_PRODUCER_ID,
      });

      expect(txProducerRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: OTHER_PRODUCER_ID,
        },
      });
      expect(result.producerId).toBe(OTHER_PRODUCER_ID);
    });

    it('should not validate producer when producer does not change', async () => {
      prepareUpdate(makeExistingFarm({ name: 'Old Farm' }));

      await service.update(FARM_ID, {
        producerId: PRODUCER_ID,
        name: 'Updated Farm',
      });

      expect(txProducerRepository.findOne).not.toHaveBeenCalled();
    });

    it('should reject a nonexistent new producer', async () => {
      prepareUpdate();
      txProducerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(FARM_ID, {
          producerId: OTHER_PRODUCER_ID,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(txFarmRepository.save).not.toHaveBeenCalled();
    });

    it('should convert foreign key violation into ConflictException', async () => {
      prepareUpdate(makeExistingFarm({ name: 'Old Farm' }));
      txFarmRepository.save.mockRejectedValue(makeForeignKeyViolationError());

      await expect(
        service.update(FARM_ID, {
          name: 'Updated Farm',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove an existing farm', async () => {
      const farm = makeExistingFarm();

      farmRepository.findOne.mockResolvedValue(farm);

      await service.remove(FARM_ID);

      expect(farmRepository.remove).toHaveBeenCalledWith(farm);
    });

    it('should not remove a nonexistent farm', async () => {
      farmRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(FARM_ID)).rejects.toThrow(NotFoundException);
      expect(farmRepository.remove).not.toHaveBeenCalled();
    });
  });
});
