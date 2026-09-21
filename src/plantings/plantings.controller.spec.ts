import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CreatePlantingDto } from './dto/create-planting.dto.js';
import { UpdatePlantingDto } from './dto/update-planting.dto.js';
import { Planting } from './entities/planting.entity.js';
import { PlantingsController } from './plantings.controller.js';
import { PlantingsService } from './plantings.service.js';

describe('PlantingsController', () => {
  let controller: PlantingsController;

  const plantingsServiceMock = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  const plantingId = '11111111-1111-4111-8111-111111111111';
  const cropSeasonId = '22222222-2222-4222-8222-222222222222';
  const cropId = '33333333-3333-4333-8333-333333333333';

  const planting: Planting = {
    id: plantingId,
    cropSeasonId,
    cropSeason: undefined!,
    cropId,
    crop: undefined!,
    plantedAreaHa: '100.5000',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlantingsController],
      providers: [
        {
          provide: PlantingsService,
          useValue: plantingsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<PlantingsController>(PlantingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a planting', async () => {
      const dto: CreatePlantingDto = {
        cropSeasonId,
        cropId,
        plantedAreaHa: '100.5',
      };

      plantingsServiceMock.create.mockResolvedValue(planting);

      await expect(controller.create(dto)).resolves.toEqual(planting);

      expect(plantingsServiceMock.create).toHaveBeenCalledOnce();
      expect(plantingsServiceMock.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all plantings', async () => {
      plantingsServiceMock.findAll.mockResolvedValue([planting]);

      await expect(controller.findAll()).resolves.toEqual([planting]);

      expect(plantingsServiceMock.findAll).toHaveBeenCalledOnce();
      expect(plantingsServiceMock.findAll).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should return a planting by id', async () => {
      plantingsServiceMock.findOne.mockResolvedValue(planting);

      await expect(controller.findOne(plantingId)).resolves.toEqual(planting);

      expect(plantingsServiceMock.findOne).toHaveBeenCalledOnce();
      expect(plantingsServiceMock.findOne).toHaveBeenCalledWith(plantingId);
    });
  });

  describe('update', () => {
    it('should update a planting', async () => {
      const dto: UpdatePlantingDto = {
        plantedAreaHa: '150.2500',
      };

      const updatedPlanting: Planting = {
        ...planting,
        plantedAreaHa: '150.2500',
      };

      plantingsServiceMock.update.mockResolvedValue(updatedPlanting);

      await expect(controller.update(plantingId, dto)).resolves.toEqual(updatedPlanting);

      expect(plantingsServiceMock.update).toHaveBeenCalledOnce();
      expect(plantingsServiceMock.update).toHaveBeenCalledWith(plantingId, dto);
    });
  });

  describe('remove', () => {
    it('should remove a planting', async () => {
      plantingsServiceMock.remove.mockResolvedValue(undefined);

      await expect(controller.remove(plantingId)).resolves.toBeUndefined();

      expect(plantingsServiceMock.remove).toHaveBeenCalledOnce();
      expect(plantingsServiceMock.remove).toHaveBeenCalledWith(plantingId);
    });
  });
});
