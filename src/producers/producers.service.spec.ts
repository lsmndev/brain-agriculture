import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it } from 'vitest';

import { DocumentType } from '@common/enums/document-type.enum.js';
import { makeUniqueViolationError } from '@tests/factories/database-error.factory.js';
import { makeProducer } from '@tests/factories/producer.factory.js';
import { TEST_IDS } from '@tests/fixtures/ids.fixture.js';
import { makeRepositoryMock, type MockRepository } from '@tests/mocks/repository.mock.js';

import { Producer } from './entities/producer.entity.js';
import { ProducersService } from './producers.service.js';

const PRODUCER_ID = TEST_IDS.producer;
const OTHER_PRODUCER_ID = '80de4a95-775d-4a7e-97b7-c21acde6f101';

const VALID_CPF = '52998224725';
const FORMATTED_CPF = '529.982.247-25';
const VALID_CNPJ = '11222333000181';
const FORMATTED_CNPJ = '11.222.333/0001-81';

describe('ProducersService', () => {
  let service: ProducersService;
  let repository: MockRepository;

  function prepareUpdate(producer = makeProducer()): Producer {
    repository.findOne.mockResolvedValueOnce(producer);
    repository.save.mockImplementation(async (entity) => entity);

    return producer;
  }

  beforeEach(async () => {
    repository = makeRepositoryMock<Producer>();

    const module = await Test.createTestingModule({
      providers: [
        ProducersService,
        {
          provide: getRepositoryToken(Producer),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(ProducersService);
  });

  describe('create', () => {
    it.each([
      ['CPF', VALID_CPF, DocumentType.CPF],
      ['CNPJ', VALID_CNPJ, DocumentType.CNPJ],
    ])('should create a producer with a valid %s', async (_, document, documentType) => {
      const dto = {
        name: 'Producer',
        document,
        documentType,
      };

      const producer = makeProducer({
        ...dto,
        id: PRODUCER_ID,
      });

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(producer);
      repository.save.mockResolvedValue(producer);

      const result = await service.create(dto);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { document } });
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(producer);
      expect(result).toBe(producer);
    });

    it.each([
      ['CPF', FORMATTED_CPF, VALID_CPF, DocumentType.CPF],
      ['CNPJ', FORMATTED_CNPJ, VALID_CNPJ, DocumentType.CNPJ],
    ])('should normalize a formatted %s before checking and saving', async (_, formatted, normalized, documentType) => {
      const dto = {
        name: 'Producer',
        document: formatted,
        documentType,
      };

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(makeProducer());
      repository.save.mockResolvedValue(makeProducer());

      await service.create(dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          document: normalized,
        },
      });
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        document: normalized,
      });
    });

    it.each([
      ['CPF', '11111111111', DocumentType.CPF],
      ['CNPJ', '11111111111111', DocumentType.CNPJ],
    ])('should reject an invalid %s', async (_, document, documentType) => {
      await expect(
        service.create({
          name: 'Producer',
          document,
          documentType,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(repository.findOne).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should reject an existing document', async () => {
      repository.findOne.mockResolvedValue(makeProducer());

      await expect(
        service.create({
          name: 'Another Producer',
          document: VALID_CPF,
          documentType: DocumentType.CPF,
        }),
      ).rejects.toThrow(ConflictException);

      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should convert database unique violation into ConflictException', async () => {
      const producer = makeProducer();

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(producer);
      repository.save.mockRejectedValue(makeUniqueViolationError());

      await expect(
        service.create({
          name: producer.name,
          document: VALID_CPF,
          documentType: DocumentType.CPF,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should rethrow unexpected database errors', async () => {
      const producer = makeProducer();
      const error = new Error('Database unavailable');

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(producer);
      repository.save.mockRejectedValue(error);

      await expect(
        service.create({
          name: producer.name,
          document: VALID_CPF,
          documentType: DocumentType.CPF,
        }),
      ).rejects.toBe(error);
    });
  });

  describe('findAll', () => {
    it('should return producers ordered by creation date descending', async () => {
      const producers = [
        makeProducer(),
        makeProducer({
          id: OTHER_PRODUCER_ID,
          name: 'Jane Doe',
        }),
      ];

      repository.find.mockResolvedValue(producers);

      await expect(service.findAll()).resolves.toBe(producers);
      expect(repository.find).toHaveBeenCalledWith({
        order: {
          createdAt: 'DESC',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return an existing producer', async () => {
      const producer = makeProducer();

      repository.findOne.mockResolvedValue(producer);

      await expect(service.findOne(PRODUCER_ID)).resolves.toBe(producer);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: PRODUCER_ID,
        },
      });
    });

    it('should reject a nonexistent producer', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(PRODUCER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update producer name', async () => {
      const producer = prepareUpdate();

      const result = await service.update(PRODUCER_ID, {
        name: 'Updated Name',
      });

      expect(repository.merge).toHaveBeenCalledWith(producer, {
        name: 'Updated Name',
        document: VALID_CPF,
        documentType: DocumentType.CPF,
      });
      expect(repository.save).toHaveBeenCalledWith(producer);
      expect(result.name).toBe('Updated Name');
    });

    it('should normalize and update document', async () => {
      const producer = prepareUpdate();

      repository.findOne.mockResolvedValueOnce(null);

      const result = await service.update(PRODUCER_ID, {
        document: FORMATTED_CNPJ,
        documentType: DocumentType.CNPJ,
      });

      expect(repository.findOne).toHaveBeenNthCalledWith(2, {
        where: {
          document: VALID_CNPJ,
        },
      });
      expect(repository.merge).toHaveBeenCalledWith(producer, {
        document: VALID_CNPJ,
        documentType: DocumentType.CNPJ,
      });
      expect(result.document).toBe(VALID_CNPJ);
      expect(result.documentType).toBe(DocumentType.CNPJ);
    });

    it.each([
      ['invalid changed document', { document: '11111111111' }],
      ['document incompatible with changed type', { documentType: DocumentType.CNPJ }],
    ])('should reject %s', async (_, changes) => {
      prepareUpdate();

      await expect(service.update(PRODUCER_ID, changes)).rejects.toThrow(BadRequestException);
      expect(repository.merge).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should reject a document belonging to another producer', async () => {
      prepareUpdate();

      repository.findOne.mockResolvedValueOnce(
        makeProducer({
          id: OTHER_PRODUCER_ID,
          document: VALID_CNPJ,
          documentType: DocumentType.CNPJ,
        }),
      );

      await expect(
        service.update(PRODUCER_ID, {
          document: VALID_CNPJ,
          documentType: DocumentType.CNPJ,
        }),
      ).rejects.toThrow(ConflictException);

      expect(repository.merge).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should allow document lookup to return the same producer', async () => {
      const producer = prepareUpdate(
        makeProducer({
          document: FORMATTED_CPF,
        }),
      );

      repository.findOne.mockResolvedValueOnce(producer);

      const result = await service.update(PRODUCER_ID, {
        document: VALID_CPF,
      });

      expect(result.document).toBe(VALID_CPF);
      expect(repository.save).toHaveBeenCalledWith(producer);
    });

    it.each([
      ['empty update', {}],
      [
        'equal values',
        {
          name: 'John Doe',
          document: VALID_CPF,
          documentType: DocumentType.CPF,
        },
      ],
    ])('should not save for %s', async (_, changes) => {
      const producer = prepareUpdate(
        makeProducer({
          name: 'John Doe',
          document: VALID_CPF,
          documentType: DocumentType.CPF,
        }),
      );

      const result = await service.update(PRODUCER_ID, changes);

      expect(result).toBe(producer);
      expect(repository.merge).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should convert database unique violation into ConflictException', async () => {
      prepareUpdate();

      repository.findOne.mockResolvedValueOnce(null);
      repository.save.mockRejectedValue(makeUniqueViolationError());

      await expect(
        service.update(PRODUCER_ID, {
          document: VALID_CNPJ,
          documentType: DocumentType.CNPJ,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should rethrow unexpected database errors', async () => {
      const error = new Error('Database unavailable');

      prepareUpdate();
      repository.save.mockRejectedValue(error);

      await expect(
        service.update(PRODUCER_ID, {
          name: 'Updated Name',
        }),
      ).rejects.toBe(error);
    });

    it('should reject a nonexistent producer', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(PRODUCER_ID, {
          name: 'Updated Name',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove an existing producer', async () => {
      const producer = makeProducer();

      repository.findOne.mockResolvedValue(producer);

      await service.remove(PRODUCER_ID);

      expect(repository.remove).toHaveBeenCalledWith(producer);
    });

    it('should reject a nonexistent producer', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(PRODUCER_ID)).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
