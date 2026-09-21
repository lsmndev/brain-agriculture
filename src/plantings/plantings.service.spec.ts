import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { beforeEach, describe, expect, it } from 'vitest';

import { CropSeason } from '@crop-seasons/entities/crop-season.entity.js';
import { Crop } from '@crops/entities/crop.entity.js';
import { Farm } from '@farms/entities/farm.entity.js';
import { makeCropSeason } from '@tests/factories/crop-season.factory.js';
import { makeCrop } from '@tests/factories/crop.factory.js';
import { makeUniqueViolationError } from '@tests/factories/database-error.factory.js';
import { makeFarm } from '@tests/factories/farm.factory.js';
import { makePlanting } from '@tests/factories/planting.factory.js';
import { TEST_IDS } from '@tests/fixtures/ids.fixture.js';
import { makeQueryBuilderMock, type MockQueryBuilder } from '@tests/mocks/query-builder.mock.js';
import { makeRepositoryMock, type MockRepository } from '@tests/mocks/repository.mock.js';
import { makeTransactionMock } from '@tests/mocks/typeorm-transaction.mock.js';

import { Planting } from './entities/planting.entity.js';
import { PlantingsService } from './plantings.service.js';

const PLANTING_ID = TEST_IDS.planting;
const CROP_SEASON_ID = TEST_IDS.cropSeason;
const CROP_ID = TEST_IDS.crop;
const FARM_ID = TEST_IDS.farm;

const OTHER_CROP_SEASON_ID = '55555555-5555-4555-8555-555555555555';
const OTHER_FARM_ID = '66666666-6666-4666-8666-666666666666';

const CREATE_DTO = {
  cropSeasonId: CROP_SEASON_ID,
  cropId: CROP_ID,
  plantedAreaHa: '40',
};

describe('PlantingsService', () => {
  let service: PlantingsService;

  let plantingRepository: MockRepository;
  let cropSeasonRepository: MockRepository;
  let cropRepository: MockRepository;
  let farmRepository: MockRepository;

  const farm = makeFarm({
    id: FARM_ID,
    arableArea: '100.0000',
  });

  const cropSeason = makeCropSeason({
    id: CROP_SEASON_ID,
    farmId: FARM_ID,
  });

  const crop = makeCrop({
    id: CROP_ID,
    name: 'Soybean',
  });

  const planting = makePlanting({
    id: PLANTING_ID,
    cropSeasonId: CROP_SEASON_ID,
    cropId: CROP_ID,
    plantedAreaHa: '40.0000',
  });

  function prepareContext(): MockQueryBuilder {
    const farmQuery = makeQueryBuilderMock();

    cropSeasonRepository.findOne.mockResolvedValue(cropSeason);
    farmRepository.createQueryBuilder.mockReturnValue(farmQuery);
    farmQuery.getOne.mockResolvedValue(farm);
    cropRepository.findOne.mockResolvedValue(crop);

    return farmQuery;
  }

  function prepareValidation(currentArea = '0'): {
    uniqueQuery: MockQueryBuilder;
    areaQuery: MockQueryBuilder;
  } {
    const uniqueQuery = makeQueryBuilderMock();
    const areaQuery = makeQueryBuilderMock();

    plantingRepository.createQueryBuilder.mockReturnValueOnce(uniqueQuery).mockReturnValueOnce(areaQuery);

    uniqueQuery.getOne.mockResolvedValue(null);
    areaQuery.getRawOne.mockResolvedValue({ total: currentArea });

    return {
      uniqueQuery,
      areaQuery,
    };
  }

  beforeEach(() => {
    plantingRepository = makeRepositoryMock<Planting>();
    cropSeasonRepository = makeRepositoryMock<CropSeason>();
    cropRepository = makeRepositoryMock<Crop>();
    farmRepository = makeRepositoryMock<Farm>();

    const transaction = makeTransactionMock([
      [Planting, plantingRepository],
      [CropSeason, cropSeasonRepository],
      [Crop, cropRepository],
      [Farm, farmRepository],
    ]);

    service = new PlantingsService(plantingRepository as never, transaction.dataSource as unknown as DataSource);
  });

  describe('create', () => {
    it('should create a planting with normalized area and farm lock', async () => {
      const farmQuery = prepareContext();

      prepareValidation('30.0000');

      plantingRepository.create.mockReturnValue(planting);
      plantingRepository.save.mockResolvedValue(planting);

      const result = await service.create(CREATE_DTO);

      expect(result).toBe(planting);
      expect(farmQuery.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(plantingRepository.create).toHaveBeenCalledWith({
        ...CREATE_DTO,
        plantedAreaHa: '40.0000',
      });
      expect(plantingRepository.save).toHaveBeenCalledWith(planting);
    });

    it.each(['0', '0.0', '0.0000'])('should reject non-positive planted area %s', async (plantedAreaHa) => {
      await expect(
        service.create({
          ...CREATE_DTO,
          plantedAreaHa,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject a nonexistent crop season', async () => {
      cropSeasonRepository.findOne.mockResolvedValue(null);

      await expect(service.create(CREATE_DTO)).rejects.toThrow(NotFoundException);
      expect(plantingRepository.save).not.toHaveBeenCalled();
    });

    it('should reject a nonexistent crop', async () => {
      prepareContext();
      cropRepository.findOne.mockResolvedValue(null);

      await expect(service.create(CREATE_DTO)).rejects.toThrow(NotFoundException);
      expect(plantingRepository.save).not.toHaveBeenCalled();
    });

    it('should reject duplicated crop in the same crop season', async () => {
      prepareContext();

      const uniqueQuery = makeQueryBuilderMock();

      plantingRepository.createQueryBuilder.mockReturnValue(uniqueQuery);
      uniqueQuery.getOne.mockResolvedValue(planting);

      await expect(service.create(CREATE_DTO)).rejects.toThrow(ConflictException);
      expect(plantingRepository.save).not.toHaveBeenCalled();
    });

    it.each([
      ['90.0000', '20.0000'],
      ['99.9999', '0.0002'],
      ['100.0000', '0.0001'],
    ])('should reject when %s + %s exceeds farm arable area', async (currentArea, plantedAreaHa) => {
      prepareContext();
      prepareValidation(currentArea);

      await expect(
        service.create({
          ...CREATE_DTO,
          plantedAreaHa,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(plantingRepository.save).not.toHaveBeenCalled();
    });

    it('should allow planted area to exactly reach farm arable area', async () => {
      prepareContext();
      prepareValidation('60.0000');

      plantingRepository.create.mockReturnValue(planting);
      plantingRepository.save.mockResolvedValue(planting);

      await expect(
        service.create({
          ...CREATE_DTO,
          plantedAreaHa: '40.0000',
        }),
      ).resolves.toBe(planting);
    });

    it('should convert PostgreSQL 23505 into ConflictException', async () => {
      const transaction = makeTransactionMock([
        [Planting, plantingRepository],
        [CropSeason, cropSeasonRepository],
        [Crop, cropRepository],
        [Farm, farmRepository],
      ]);

      transaction.dataSource.transaction.mockRejectedValue(makeUniqueViolationError());

      service = new PlantingsService(plantingRepository as never, transaction.dataSource as unknown as DataSource);

      await expect(service.create(CREATE_DTO)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all plantings with relations ordered by creation date', async () => {
      plantingRepository.find.mockResolvedValue([planting]);

      await expect(service.findAll()).resolves.toEqual([planting]);
      expect(plantingRepository.find).toHaveBeenCalledWith({
        relations: {
          cropSeason: true,
          crop: true,
        },
        order: {
          createdAt: 'DESC',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a planting', async () => {
      plantingRepository.findOne.mockResolvedValue(planting);

      await expect(service.findOne(PLANTING_ID)).resolves.toBe(planting);
    });

    it('should reject a nonexistent planting', async () => {
      plantingRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(PLANTING_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      plantingRepository.findOne.mockResolvedValue(planting);
    });

    it('should return current planting when nothing changed', async () => {
      prepareContext();

      const result = await service.update(PLANTING_ID, {});

      expect(result).toBe(planting);
      expect(plantingRepository.merge).not.toHaveBeenCalled();
      expect(plantingRepository.save).not.toHaveBeenCalled();
    });

    it('should update planted area in the same crop season', async () => {
      prepareContext();

      const areaQuery = makeQueryBuilderMock();

      plantingRepository.createQueryBuilder.mockReturnValue(areaQuery);
      areaQuery.getRawOne.mockResolvedValue({ total: '50.0000' });

      plantingRepository.save.mockResolvedValue({
        ...planting,
        plantedAreaHa: '45.0000',
      });

      const result = await service.update(PLANTING_ID, {
        plantedAreaHa: '45',
      });

      expect(areaQuery.andWhere).toHaveBeenCalledWith('planting.id != :ignorePlantingId', {
        ignorePlantingId: PLANTING_ID,
      });
      expect(plantingRepository.merge).toHaveBeenCalledWith(planting, {
        cropSeasonId: CROP_SEASON_ID,
        cropId: CROP_ID,
        plantedAreaHa: '45.0000',
      });
      expect(result.plantedAreaHa).toBe('45.0000');
    });

    it('should reject a nonexistent planting', async () => {
      plantingRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(PLANTING_ID, {
          plantedAreaHa: '10',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should lock both farms when moving planting between farms', async () => {
      const targetCropSeason = makeCropSeason({
        id: OTHER_CROP_SEASON_ID,
        farmId: OTHER_FARM_ID,
      });

      const targetFarm = makeFarm({
        id: OTHER_FARM_ID,
        arableArea: '200.0000',
      });

      const sourceFarmQuery = makeQueryBuilderMock();
      const targetFarmQuery = makeQueryBuilderMock();
      const uniqueQuery = makeQueryBuilderMock();
      const areaQuery = makeQueryBuilderMock();

      cropSeasonRepository.findOne.mockResolvedValueOnce(cropSeason).mockResolvedValueOnce(targetCropSeason);

      farmRepository.createQueryBuilder.mockReturnValueOnce(sourceFarmQuery).mockReturnValueOnce(targetFarmQuery);

      sourceFarmQuery.getOne.mockResolvedValue(farm);
      targetFarmQuery.getOne.mockResolvedValue(targetFarm);

      cropRepository.findOne.mockResolvedValue(crop);

      plantingRepository.createQueryBuilder.mockReturnValueOnce(uniqueQuery).mockReturnValueOnce(areaQuery);

      uniqueQuery.getOne.mockResolvedValue(null);
      areaQuery.getRawOne.mockResolvedValue({ total: '20.0000' });

      plantingRepository.save.mockResolvedValue({
        ...planting,
        cropSeasonId: OTHER_CROP_SEASON_ID,
      });

      await service.update(PLANTING_ID, {
        cropSeasonId: OTHER_CROP_SEASON_ID,
      });

      expect(farmRepository.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(sourceFarmQuery.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(targetFarmQuery.setLock).toHaveBeenCalledWith('pessimistic_write');
    });
  });

  describe('remove', () => {
    it('should remove an existing planting', async () => {
      plantingRepository.findOne.mockResolvedValue(planting);

      await service.remove(PLANTING_ID);

      expect(plantingRepository.remove).toHaveBeenCalledWith(planting);
    });

    it('should reject a nonexistent planting', async () => {
      plantingRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(PLANTING_ID)).rejects.toThrow(NotFoundException);
      expect(plantingRepository.remove).not.toHaveBeenCalled();
    });
  });
});
