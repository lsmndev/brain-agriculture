import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { beforeEach, describe, expect, it } from 'vitest';

import { Farm } from '@farms/entities/farm.entity.js';
import { Planting } from '@plantings/entities/planting.entity.js';
import { makeCropSeason } from '@tests/factories/crop-season.factory.js';
import { makeForeignKeyViolationError, makeUniqueViolationError } from '@tests/factories/database-error.factory.js';
import { makeFarm } from '@tests/factories/farm.factory.js';
import { TEST_IDS } from '@tests/fixtures/ids.fixture.js';
import { makeQueryBuilderMock, type MockQueryBuilder } from '@tests/mocks/query-builder.mock.js';
import { makeRepositoryMock, type MockRepository } from '@tests/mocks/repository.mock.js';
import { makeTransactionMock } from '@tests/mocks/typeorm-transaction.mock.js';

import { CropSeasonsService } from './crop-seasons.service.js';
import { CropSeason } from './entities/crop-season.entity.js';

const FARM_ID = TEST_IDS.farm;
const CROP_SEASON_ID = TEST_IDS.cropSeason;
const OTHER_FARM_ID = '22222222-2222-4222-8222-222222222222';

describe('CropSeasonsService', () => {
  let service: CropSeasonsService;

  let repository: MockRepository;
  let farmRepository: MockRepository;
  let txRepository: MockRepository;
  let txFarmRepository: MockRepository;
  let txPlantingRepository: MockRepository;

  let seasonQuery: MockQueryBuilder;
  let farmQuery: MockQueryBuilder;
  let plantingQuery: MockQueryBuilder;

  function prepareUpdate(cropSeason = makeCropSeason({ id: CROP_SEASON_ID, farmId: FARM_ID })) {
    txRepository.findOne.mockResolvedValue(cropSeason);
    txRepository.save.mockImplementation(async (entity) => entity);

    return cropSeason;
  }

  function prepareMove(plantedArea: string | undefined = '40.0000', targetArableArea = '50.0000') {
    let currentFarmId: string | undefined;

    farmQuery.where.mockImplementation((_condition, params) => {
      currentFarmId = params.farmId;

      return farmQuery;
    });

    farmQuery.getOne.mockImplementation(async () => {
      if (currentFarmId === FARM_ID) {
        return makeFarm({ id: FARM_ID, arableArea: '100.0000' });
      }

      if (currentFarmId === OTHER_FARM_ID) {
        return makeFarm({ id: OTHER_FARM_ID, arableArea: targetArableArea });
      }

      return null;
    });

    plantingQuery.getRawOne.mockResolvedValue(plantedArea === undefined ? undefined : { total: plantedArea });
    seasonQuery.getOne.mockResolvedValue(null);
  }

  beforeEach(async () => {
    repository = makeRepositoryMock<CropSeason>();
    farmRepository = makeRepositoryMock<Farm>();

    txRepository = makeRepositoryMock<CropSeason>();
    txFarmRepository = makeRepositoryMock<Farm>();
    txPlantingRepository = makeRepositoryMock<Planting>();

    seasonQuery = makeQueryBuilderMock();
    farmQuery = makeQueryBuilderMock();
    plantingQuery = makeQueryBuilderMock();

    txRepository.createQueryBuilder.mockReturnValue(seasonQuery);
    txFarmRepository.createQueryBuilder.mockReturnValue(farmQuery);
    txPlantingRepository.createQueryBuilder.mockReturnValue(plantingQuery);

    const transaction = makeTransactionMock([
      [CropSeason, txRepository],
      [Farm, txFarmRepository],
      [Planting, txPlantingRepository],
    ]);

    const module = await Test.createTestingModule({
      providers: [
        CropSeasonsService,
        {
          provide: getRepositoryToken(CropSeason),
          useValue: repository,
        },
        {
          provide: getRepositoryToken(Farm),
          useValue: farmRepository,
        },
        {
          provide: DataSource,
          useValue: transaction.dataSource,
        },
      ],
    }).compile();

    service = module.get(CropSeasonsService);
  });

  describe('create', () => {
    const dto = {
      farmId: FARM_ID,
      name: 'Safra 2026',
      year: 2026,
    };

    it('should create a crop season', async () => {
      const cropSeason = makeCropSeason({ id: CROP_SEASON_ID, ...dto });

      farmRepository.findOne.mockResolvedValue(makeFarm({ id: FARM_ID }));
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(cropSeason);
      repository.save.mockResolvedValue(cropSeason);

      await expect(service.create(dto)).resolves.toBe(cropSeason);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          farmId: FARM_ID,
          year: 2026,
        },
      });
      expect(repository.save).toHaveBeenCalledWith(cropSeason);
    });

    it('should reject a nonexistent farm', async () => {
      farmRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should reject duplicate farm and year', async () => {
      farmRepository.findOne.mockResolvedValue(makeFarm({ id: FARM_ID }));
      repository.findOne.mockResolvedValue(makeCropSeason());

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it.each([
      ['unique violation', makeUniqueViolationError()],
      ['foreign key violation', makeForeignKeyViolationError()],
    ])('should convert %s into ConflictException', async (_, error) => {
      const cropSeason = makeCropSeason(dto);

      farmRepository.findOne.mockResolvedValue(makeFarm({ id: FARM_ID }));
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(cropSeason);
      repository.save.mockRejectedValue(error);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return crop seasons ordered by year descending', async () => {
      const cropSeasons = [makeCropSeason({ year: 2026 }), makeCropSeason({ year: 2025 })];

      repository.find.mockResolvedValue(cropSeasons);

      await expect(service.findAll()).resolves.toBe(cropSeasons);
      expect(repository.find).toHaveBeenCalledWith({
        order: {
          year: 'DESC',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return an existing crop season', async () => {
      const cropSeason = makeCropSeason({ id: CROP_SEASON_ID });

      repository.findOne.mockResolvedValue(cropSeason);

      await expect(service.findOne(CROP_SEASON_ID)).resolves.toBe(cropSeason);
    });

    it('should throw when crop season does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(CROP_SEASON_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update the crop season', async () => {
      const cropSeason = prepareUpdate(
        makeCropSeason({
          id: CROP_SEASON_ID,
          farmId: FARM_ID,
          name: 'Safra 2026',
        }),
      );

      const result = await service.update(CROP_SEASON_ID, {
        name: 'Safra Principal',
      });

      expect(txRepository.merge).toHaveBeenCalledWith(cropSeason, { name: 'Safra Principal' });
      expect(txRepository.save).toHaveBeenCalledWith(cropSeason);
      expect(result.name).toBe('Safra Principal');
      expect(txFarmRepository.createQueryBuilder).not.toHaveBeenCalled();
      expect(txPlantingRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should return without saving when nothing changes', async () => {
      const cropSeason = prepareUpdate();

      const result = await service.update(CROP_SEASON_ID, {
        name: cropSeason.name,
      });

      expect(result).toBe(cropSeason);
      expect(txRepository.merge).not.toHaveBeenCalled();
      expect(txRepository.save).not.toHaveBeenCalled();
    });

    it('should throw when crop season does not exist', async () => {
      txRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(CROP_SEASON_ID, {
          name: 'Safra Nova',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should check uniqueness when year changes', async () => {
      prepareUpdate(
        makeCropSeason({
          id: CROP_SEASON_ID,
          farmId: FARM_ID,
          year: 2026,
        }),
      );

      seasonQuery.getOne.mockResolvedValue(null);

      await service.update(CROP_SEASON_ID, {
        year: 2027,
      });

      expect(txRepository.createQueryBuilder).toHaveBeenCalledWith('cropSeason');
      expect(seasonQuery.where).toHaveBeenCalledWith('cropSeason.farmId = :farmId', { farmId: FARM_ID });
      expect(seasonQuery.andWhere).toHaveBeenCalledWith('cropSeason.year = :year', { year: 2027 });
      expect(seasonQuery.andWhere).toHaveBeenCalledWith('cropSeason.id != :ignoreId', { ignoreId: CROP_SEASON_ID });
    });

    it.each([
      ['smaller than target area', '40.0000'],
      ['equal to target area', '50.0000'],
      ['no existing plantings', undefined],
    ])('should move crop season when planted area is %s', async (_, plantedArea) => {
      prepareUpdate();
      prepareMove(plantedArea);

      const result = await service.update(CROP_SEASON_ID, {
        farmId: OTHER_FARM_ID,
      });

      expect(txFarmRepository.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(farmQuery.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(txPlantingRepository.createQueryBuilder).toHaveBeenCalledWith('planting');
      expect(plantingQuery.where).toHaveBeenCalledWith('planting.cropSeasonId = :cropSeasonId', {
        cropSeasonId: CROP_SEASON_ID,
      });
      expect(result.farmId).toBe(OTHER_FARM_ID);
    });

    it('should reject move when plantings exceed target arable area', async () => {
      prepareUpdate();
      prepareMove('50.0001');

      await expect(
        service.update(CROP_SEASON_ID, {
          farmId: OTHER_FARM_ID,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(txRepository.save).not.toHaveBeenCalled();
    });

    it('should reject move when a farm does not exist', async () => {
      prepareUpdate();

      farmQuery.getOne.mockResolvedValue(null);

      await expect(
        service.update(CROP_SEASON_ID, {
          farmId: OTHER_FARM_ID,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(txRepository.save).not.toHaveBeenCalled();
    });

    it('should reject duplicate farm and year when moving', async () => {
      prepareUpdate();
      prepareMove('10.0000');

      seasonQuery.getOne.mockResolvedValue(makeCropSeason({ farmId: OTHER_FARM_ID }));

      await expect(
        service.update(CROP_SEASON_ID, {
          farmId: OTHER_FARM_ID,
        }),
      ).rejects.toThrow(ConflictException);

      expect(txRepository.save).not.toHaveBeenCalled();
    });

    it.each([
      ['unique violation', makeUniqueViolationError()],
      ['foreign key violation', makeForeignKeyViolationError()],
    ])('should convert %s during update into ConflictException', async (_, error) => {
      prepareUpdate(
        makeCropSeason({
          id: CROP_SEASON_ID,
          farmId: FARM_ID,
          year: 2026,
        }),
      );

      seasonQuery.getOne.mockResolvedValue(null);
      txRepository.save.mockRejectedValue(error);

      await expect(
        service.update(CROP_SEASON_ID, {
          year: 2027,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove an existing crop season', async () => {
      const cropSeason = makeCropSeason({ id: CROP_SEASON_ID });

      repository.findOne.mockResolvedValue(cropSeason);

      await service.remove(CROP_SEASON_ID);

      expect(repository.remove).toHaveBeenCalledWith(cropSeason);
    });

    it('should not remove a nonexistent crop season', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(CROP_SEASON_ID)).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
