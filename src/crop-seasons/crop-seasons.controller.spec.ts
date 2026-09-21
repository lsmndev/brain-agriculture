import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { CreateCropSeasonDto } from './dto/create-crop-season.dto.js';
import { UpdateCropSeasonDto } from './dto/update-crop-season.dto.js';
import { CropSeason } from './entities/crop-season.entity.js';
import { CropSeasonsController } from './crop-seasons.controller.js';
import { CropSeasonsService } from './crop-seasons.service.js';

describe('CropSeasonsController', () => {
  let controller: CropSeasonsController;

  let service: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  const cropSeasonId = '11111111-1111-4111-8111-111111111111';
  const farmId = '22222222-2222-4222-8222-222222222222';

  const cropSeason: CropSeason = {
    id: cropSeasonId,
    farmId,
    farm: undefined!,
    name: 'Safra 2026',
    year: 2026,
    plantings: [],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    service = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CropSeasonsController],
      providers: [
        {
          provide: CropSeasonsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<CropSeasonsController>(CropSeasonsController);
  });

  describe('create', () => {
    it('should create a crop season', async () => {
      const dto: CreateCropSeasonDto = {
        farmId,
        name: 'Safra 2026',
        year: 2026,
      };

      service.create.mockResolvedValue(cropSeason);

      await expect(controller.create(dto)).resolves.toEqual(cropSeason);

      expect(service.create).toHaveBeenCalledOnce();
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all crop seasons', async () => {
      service.findAll.mockResolvedValue([cropSeason]);

      await expect(controller.findAll()).resolves.toEqual([cropSeason]);

      expect(service.findAll).toHaveBeenCalledOnce();
      expect(service.findAll).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should return a crop season by id', async () => {
      service.findOne.mockResolvedValue(cropSeason);

      await expect(controller.findOne(cropSeasonId)).resolves.toEqual(cropSeason);

      expect(service.findOne).toHaveBeenCalledOnce();
      expect(service.findOne).toHaveBeenCalledWith(cropSeasonId);
    });
  });

  describe('update', () => {
    it('should update a crop season', async () => {
      const dto: UpdateCropSeasonDto = {
        name: 'Safra 2026/2027',
        year: 2027,
      };

      const updatedCropSeason: CropSeason = {
        ...cropSeason,
        name: 'Safra 2026/2027',
        year: 2027,
      };

      service.update.mockResolvedValue(updatedCropSeason);

      await expect(controller.update(cropSeasonId, dto)).resolves.toEqual(updatedCropSeason);

      expect(service.update).toHaveBeenCalledOnce();
      expect(service.update).toHaveBeenCalledWith(cropSeasonId, dto);
    });
  });

  describe('remove', () => {
    it('should remove a crop season', async () => {
      service.remove.mockResolvedValue(undefined);

      await expect(controller.remove(cropSeasonId)).resolves.toBeUndefined();

      expect(service.remove).toHaveBeenCalledOnce();
      expect(service.remove).toHaveBeenCalledWith(cropSeasonId);
    });
  });
});
