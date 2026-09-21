import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike } from 'typeorm';
import { beforeEach, describe, expect, it } from 'vitest';

import { makeCrop, makeCreateCropDto } from '@tests/factories/crop.factory.js';
import {
  makeForeignKeyViolationError,
  makeUniqueViolationError,
} from '@tests/factories/database-error.factory.js';
import { TEST_IDS } from '@tests/fixtures/ids.fixture.js';
import { makeRepositoryMock, type MockRepository } from '@tests/mocks/repository.mock.js';

import { CropsService } from './crops.service.js';
import { Crop } from './entities/crop.entity.js';

const CROP_ID = TEST_IDS.crop;

describe('CropsService', () => {
  let service: CropsService;
  let repository: MockRepository;

  beforeEach(async () => {
    repository = makeRepositoryMock<Crop>();

    const module = await Test.createTestingModule({
      providers: [
        CropsService,
        {
          provide: getRepositoryToken(Crop),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(CropsService);
  });

  describe('create', () => {
    it('should normalize and create a crop', async () => {
      const dto = makeCreateCropDto({
        name: '  Soybean  ',
      });
      const crop = makeCrop({
        id: CROP_ID,
        name: 'Soybean',
      });

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(crop);
      repository.save.mockResolvedValue(crop);

      await expect(service.create(dto)).resolves.toBe(crop);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          name: ILike('Soybean'),
        },
      });
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        name: 'Soybean',
      });
    });

    it('should reject a duplicate name case-insensitively', async () => {
      repository.findOne.mockResolvedValue(
        makeCrop({
          name: 'Soybean',
        }),
      );

      await expect(
        service.create(
          makeCreateCropDto({
            name: 'soybean',
          }),
        ),
      ).rejects.toThrow(ConflictException);

      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should convert unique violation into ConflictException', async () => {
      const dto = makeCreateCropDto();
      const crop = makeCrop();

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(crop);
      repository.save.mockRejectedValue(makeUniqueViolationError());

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return crops ordered by name', async () => {
      const crops = [
        makeCrop({
          name: 'Corn',
        }),
        makeCrop({
          name: 'Soybean',
        }),
      ];

      repository.find.mockResolvedValue(crops);

      await expect(service.findAll()).resolves.toBe(crops);

      expect(repository.find).toHaveBeenCalledWith({
        order: {
          name: 'ASC',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return an existing crop', async () => {
      const crop = makeCrop({
        id: CROP_ID,
      });

      repository.findOne.mockResolvedValue(crop);

      await expect(service.findOne(CROP_ID)).resolves.toBe(crop);
    });

    it('should throw when crop does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(CROP_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should normalize and update the name', async () => {
      const crop = makeCrop({
        id: CROP_ID,
        name: 'Soybean',
      });

      repository.findOne.mockResolvedValueOnce(crop).mockResolvedValueOnce(null);
      repository.save.mockImplementation(async (entity) => entity);

      const result = await service.update(CROP_ID, {
        name: '  Corn  ',
      });

      expect(repository.findOne).toHaveBeenNthCalledWith(2, {
        where: {
          name: ILike('Corn'),
        },
      });
      expect(repository.merge).toHaveBeenCalledWith(crop, {
        name: 'Corn',
      });
      expect(repository.save).toHaveBeenCalledWith(crop);
      expect(result.name).toBe('Corn');
    });

    it('should return without saving when nothing changes', async () => {
      const crop = makeCrop({
        id: CROP_ID,
        name: 'Soybean',
      });

      repository.findOne.mockResolvedValue(crop);

      const result = await service.update(CROP_ID, {
        name: 'Soybean',
      });

      expect(result).toBe(crop);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should allow changing only the name casing without checking uniqueness', async () => {
      const crop = makeCrop({
        id: CROP_ID,
        name: 'Soybean',
      });

      repository.findOne.mockResolvedValue(crop);
      repository.save.mockImplementation(async (entity) => entity);

      const result = await service.update(CROP_ID, {
        name: 'soybean',
      });

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledWith(crop, {
        name: 'soybean',
      });
      expect(result.name).toBe('soybean');
    });

    it('should reject a name already used by another crop', async () => {
      const crop = makeCrop({
        id: CROP_ID,
        name: 'Soybean',
      });

      repository.findOne.mockResolvedValueOnce(crop).mockResolvedValueOnce(
        makeCrop({
          name: 'Corn',
        }),
      );

      await expect(
        service.update(CROP_ID, {
          name: 'Corn',
        }),
      ).rejects.toThrow(ConflictException);

      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should convert unique violation into ConflictException', async () => {
      const crop = makeCrop({
        id: CROP_ID,
        name: 'Soybean',
      });

      repository.findOne.mockResolvedValueOnce(crop).mockResolvedValueOnce(null);
      repository.save.mockRejectedValue(makeUniqueViolationError());

      await expect(
        service.update(CROP_ID, {
          name: 'Corn',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove an existing crop', async () => {
      const crop = makeCrop({
        id: CROP_ID,
      });

      repository.findOne.mockResolvedValue(crop);

      await service.remove(CROP_ID);

      expect(repository.remove).toHaveBeenCalledWith(crop);
    });

    it('should not remove a nonexistent crop', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(CROP_ID)).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('should reject removal when crop is used by plantings', async () => {
      const crop = makeCrop({
        id: CROP_ID,
      });

      repository.findOne.mockResolvedValue(crop);
      repository.remove.mockRejectedValue(makeForeignKeyViolationError());

      await expect(service.remove(CROP_ID)).rejects.toThrow(ConflictException);
      expect(repository.remove).toHaveBeenCalledWith(crop);
    });
  });
});