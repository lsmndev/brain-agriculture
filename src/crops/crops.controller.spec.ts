import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { CreateCropDto } from './dto/create-crop.dto.js';
import { UpdateCropDto } from './dto/update-crop.dto.js';
import { Crop } from './entities/crop.entity.js';
import { CropsController } from './crops.controller.js';
import { CropsService } from './crops.service.js';

describe('CropsController', () => {
  let controller: CropsController;

  let service: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  const cropId = '11111111-1111-4111-8111-111111111111';

  const crop: Crop = {
    id: cropId,
    name: 'Soybean',
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
      controllers: [CropsController],
      providers: [
        {
          provide: CropsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<CropsController>(CropsController);
  });

  describe('create', () => {
    it('should create a crop', async () => {
      const dto: CreateCropDto = {
        name: 'Soybean',
      };

      service.create.mockResolvedValue(crop);

      await expect(controller.create(dto)).resolves.toEqual(crop);

      expect(service.create).toHaveBeenCalledOnce();
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all crops', async () => {
      service.findAll.mockResolvedValue([crop]);

      await expect(controller.findAll()).resolves.toEqual([crop]);

      expect(service.findAll).toHaveBeenCalledOnce();
      expect(service.findAll).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should return a crop by id', async () => {
      service.findOne.mockResolvedValue(crop);

      await expect(controller.findOne(cropId)).resolves.toEqual(crop);

      expect(service.findOne).toHaveBeenCalledOnce();
      expect(service.findOne).toHaveBeenCalledWith(cropId);
    });
  });

  describe('update', () => {
    it('should update a crop', async () => {
      const dto: UpdateCropDto = {
        name: 'Corn',
      };

      const updatedCrop: Crop = {
        ...crop,
        name: 'Corn',
      };

      service.update.mockResolvedValue(updatedCrop);

      await expect(controller.update(cropId, dto)).resolves.toEqual(updatedCrop);

      expect(service.update).toHaveBeenCalledOnce();
      expect(service.update).toHaveBeenCalledWith(cropId, dto);
    });
  });

  describe('remove', () => {
    it('should remove a crop', async () => {
      service.remove.mockResolvedValue(undefined);

      await expect(controller.remove(cropId)).resolves.toBeUndefined();

      expect(service.remove).toHaveBeenCalledOnce();
      expect(service.remove).toHaveBeenCalledWith(cropId);
    });
  });
});
