import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { State } from '../common/enums/state.enum.js';

import { CreateFarmDto } from './dto/create-farm.dto.js';
import { UpdateFarmDto } from './dto/update-farm.dto.js';
import { Farm } from './entities/farm.entity.js';
import { FarmsController } from './farms.controller.js';
import { FarmsService } from './farms.service.js';

describe('FarmsController', () => {
  let controller: FarmsController;

  let service: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  const farmId = '11111111-1111-4111-8111-111111111111';

  const producerId = '22222222-2222-4222-8222-222222222222';

  const farm: Farm = {
    id: farmId,
    producerId,
    producer: undefined!,
    name: 'Green Valley Farm',
    city: 'São Paulo',
    state: State.SP,
    totalArea: '1000.5000',
    arableArea: '750.2500',
    vegetationArea: '250.2500',
    cropSeasons: [],
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
      controllers: [FarmsController],
      providers: [
        {
          provide: FarmsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<FarmsController>(FarmsController);
  });

  describe('create', () => {
    it('should create a farm', async () => {
      const dto: CreateFarmDto = {
        producerId,
        name: 'Green Valley Farm',
        city: 'São Paulo',
        state: State.SP,
        totalArea: '1000.5',
        arableArea: '750.25',
        vegetationArea: '250.25',
      };

      service.create.mockResolvedValue(farm);

      await expect(controller.create(dto)).resolves.toEqual(farm);

      expect(service.create).toHaveBeenCalledOnce();
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all farms', async () => {
      service.findAll.mockResolvedValue([farm]);

      await expect(controller.findAll()).resolves.toEqual([farm]);

      expect(service.findAll).toHaveBeenCalledOnce();

      expect(service.findAll).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should return a farm by id', async () => {
      service.findOne.mockResolvedValue(farm);

      await expect(controller.findOne(farmId)).resolves.toEqual(farm);

      expect(service.findOne).toHaveBeenCalledOnce();

      expect(service.findOne).toHaveBeenCalledWith(farmId);
    });
  });

  describe('update', () => {
    it('should update a farm', async () => {
      const dto: UpdateFarmDto = {
        name: 'Updated Farm',
        arableArea: '700.0000',
      };
      const updatedFarm: Farm = {
        ...farm,
        name: 'Updated Farm',
        arableArea: '700.0000',
      };

      service.update.mockResolvedValue(updatedFarm);

      await expect(controller.update(farmId, dto)).resolves.toEqual(updatedFarm);

      expect(service.update).toHaveBeenCalledOnce();
      expect(service.update).toHaveBeenCalledWith(farmId, dto);
    });
  });

  describe('remove', () => {
    it('should remove a farm', async () => {
      service.remove.mockResolvedValue(undefined);

      await expect(controller.remove(farmId)).resolves.toBeUndefined();

      expect(service.remove).toHaveBeenCalledOnce();
      expect(service.remove).toHaveBeenCalledWith(farmId);
    });
  });
});
