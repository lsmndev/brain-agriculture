import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isCNPJ, isCPF } from 'validation-br';

import { DocumentType } from '@common/enums/document-type.enum.js';

import { CreateProducerDto } from './dto/create-producer.dto.js';
import { UpdateProducerDto } from './dto/update-producer.dto.js';
import { Producer } from './entities/producer.entity.js';
import { getDatabaseErrorCode, POSTGRES_ERROR } from '@common/database/database-error.util.js';

@Injectable()
export class ProducersService {
  private readonly logger = new Logger(ProducersService.name);
  
  constructor(
    @InjectRepository(Producer)
    private readonly producerRepository: Repository<Producer>,
  ) {}

  async create(createProducerDto: CreateProducerDto): Promise<Producer> {
    const document = this.normalizeDocument(createProducerDto.document);

    this.validateDocument(document, createProducerDto.documentType);

    const existingProducer = await this.producerRepository.findOne({
      where: {
        document,
      },
    });

    if (existingProducer) {
      throw new ConflictException('Já existe um produtor cadastrado com este CPF/CNPJ.');
    }

    const producer = this.producerRepository.create({
      ...createProducerDto,
      document,
    });

    return this.saveProducer(producer);
  }

  async findAll(): Promise<Producer[]> {
    this.logger.log('Fetching producers');
    
    return this.producerRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Producer> {
    const producer = await this.producerRepository.findOne({
      where: {
        id,
      },
    });

    if (!producer) {
      throw new NotFoundException('Produtor não encontrado.');
    }

    return producer;
  }

  async update(id: string, updateProducerDto: UpdateProducerDto): Promise<Producer> {
    const producer = await this.findOne(id);
    const document = this.normalizeDocument(updateProducerDto.document ?? producer.document);
    const documentType = updateProducerDto.documentType ?? producer.documentType;

    this.validateDocument(document, documentType);

    if (document !== producer.document) {
      const existingProducer = await this.producerRepository.findOne({
        where: {
          document,
        },
      });

      if (existingProducer && existingProducer.id !== id) {
        throw new ConflictException('Já existe um produtor cadastrado com este CPF/CNPJ.');
      }
    }

    const hasChanges =
      document !== producer.document ||
      documentType !== producer.documentType ||
      (updateProducerDto.name !== undefined && updateProducerDto.name !== producer.name);

    if (!hasChanges) {
      return producer;
    }

    this.producerRepository.merge(producer, {
      ...updateProducerDto,
      document,
      documentType,
    });

    return this.saveProducer(producer);
  }

  async remove(id: string): Promise<void> {
    const producer = await this.findOne(id);

    try {
      await this.producerRepository.remove(producer);
    } catch (error) {
      const code = getDatabaseErrorCode(error);

      if (code === POSTGRES_ERROR.FOREIGN_KEY_VIOLATION) {
        throw new ConflictException('Não é possível excluir um produtor que possui propriedades rurais cadastradas.');
      }

      throw error;
    }
  }

  private normalizeDocument(document: string): string {
    return document.replace(/\D/g, '');
  }

  private validateDocument(document: string, documentType: DocumentType): void {
    let isValid = false;

    if (documentType === DocumentType.CPF) {
      isValid = isCPF(document);
    }

    if (documentType === DocumentType.CNPJ) {
      isValid = isCNPJ(document);
    }

    if (!isValid) {
      throw new BadRequestException(`O documento informado não é um ${documentType} válido.`);
    }
  }

  private async saveProducer(producer: Producer): Promise<Producer> {
    try {
      return await this.producerRepository.save(producer);
    } catch (error) {
      const code = getDatabaseErrorCode(error);

      if (code === POSTGRES_ERROR.UNIQUE_VIOLATION) {
        throw new ConflictException('Já existe um produtor cadastrado com este CPF/CNPJ.');
      }

      throw error;
    }
  }
}
