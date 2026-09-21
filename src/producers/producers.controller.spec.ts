import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { DocumentType } from '@common/enums/document-type.enum.js';

import { CreateProducerDto } from './dto/create-producer.dto.js';
import { UpdateProducerDto } from './dto/update-producer.dto.js';
import { Producer } from './entities/producer.entity.js';
import { ProducersController } from './producers.controller.js';
import { ProducersService } from './producers.service.js';

describe('ProducersController', () => {
  let controller: ProducersController;
  let service: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  const producerId = '11111111-1111-4111-8111-111111111111';

  const producer: Producer = {
    id: producerId,
    document: '12345678909',
    documentType: DocumentType.CPF,
    name: 'John Doe',
    farms: [],
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
      controllers: [ProducersController],
      providers: [
        {
          provide: ProducersService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<ProducersController>(ProducersController);
  });

  describe('create', () => {
    it('should create a producer', async () => {
      const dto: CreateProducerDto = {
        document: '12345678909',
        documentType: DocumentType.CPF,
        name: 'John Doe',
      };

      service.create.mockResolvedValue(producer);

      await expect(controller.create(dto)).resolves.toEqual(producer);

      expect(service.create).toHaveBeenCalledOnce();
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all producers', async () => {
      service.findAll.mockResolvedValue([producer]);

      await expect(controller.findAll()).resolves.toEqual([producer]);

      expect(service.findAll).toHaveBeenCalledOnce();
      expect(service.findAll).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should return a producer by id', async () => {
      service.findOne.mockResolvedValue(producer);

      await expect(controller.findOne(producerId)).resolves.toEqual(producer);

      expect(service.findOne).toHaveBeenCalledOnce();
      expect(service.findOne).toHaveBeenCalledWith(producerId);
    });
  });

  describe('update', () => {
    it('should update a producer', async () => {
      const dto: UpdateProducerDto = {
        name: 'John Updated',
      };
      const updatedProducer: Producer = {
        ...producer,
        name: 'John Updated',
      };

      service.update.mockResolvedValue(updatedProducer);

      await expect(controller.update(producerId, dto)).resolves.toEqual(updatedProducer);

      expect(service.update).toHaveBeenCalledOnce();
      expect(service.update).toHaveBeenCalledWith(producerId, dto);
    });
  });

  describe('remove', () => {
    it('should remove a producer', async () => {
      service.remove.mockResolvedValue(undefined);

      await expect(controller.remove(producerId)).resolves.toBeUndefined();

      expect(service.remove).toHaveBeenCalledOnce();
      expect(service.remove).toHaveBeenCalledWith(producerId);
    });
  });
});
