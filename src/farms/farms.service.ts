import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { decimalToBigInt, normalizeDecimal } from '@common/utils/decimal.util.js';
import { Planting } from '@plantings/entities/planting.entity.js';
import { Producer } from '@producers/entities/producer.entity.js';

import { CreateFarmDto } from './dto/create-farm.dto.js';
import { UpdateFarmDto } from './dto/update-farm.dto.js';
import { Farm } from './entities/farm.entity.js';
import { getDatabaseErrorCode, POSTGRES_ERROR } from '@common/database/database-error.util.js';
import { validateFarmAreas } from './farms.rules.js';

@Injectable()
export class FarmsService {
  constructor(
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,

    @InjectRepository(Producer)
    private readonly producerRepository: Repository<Producer>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createFarmDto: CreateFarmDto): Promise<Farm> {
    const producer = await this.producerRepository.findOne({
      where: {
        id: createFarmDto.producerId,
      },
    });

    if (!producer) {
      throw new NotFoundException('Producer not found');
    }

    validateFarmAreas(createFarmDto.totalArea, createFarmDto.arableArea, createFarmDto.vegetationArea);

    const farm = this.farmRepository.create({
      ...createFarmDto,
      totalArea: normalizeDecimal(createFarmDto.totalArea),
      arableArea: normalizeDecimal(createFarmDto.arableArea),
      vegetationArea: normalizeDecimal(createFarmDto.vegetationArea),
    });

    try {
      return await this.farmRepository.save(farm);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAll(): Promise<Farm[]> {
    return this.farmRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Farm> {
    const farm = await this.farmRepository.findOne({
      where: {
        id,
      },
    });

    if (!farm) {
      throw new NotFoundException('Farm not found');
    }

    return farm;
  }

  async update(id: string, updateFarmDto: UpdateFarmDto): Promise<Farm> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const farm = await this.findAndLockFarm(manager, id);

        const totalArea =
          updateFarmDto.totalArea !== undefined ? normalizeDecimal(updateFarmDto.totalArea) : farm.totalArea;

        const arableArea =
          updateFarmDto.arableArea !== undefined ? normalizeDecimal(updateFarmDto.arableArea) : farm.arableArea;

        const vegetationArea =
          updateFarmDto.vegetationArea !== undefined
            ? normalizeDecimal(updateFarmDto.vegetationArea)
            : farm.vegetationArea;

        validateFarmAreas(totalArea, arableArea, vegetationArea);

        const producerId = updateFarmDto.producerId;
        const producerChanged = producerId !== undefined && producerId !== farm.producerId;

        if (producerChanged) {
          await this.ensureProducerExists(manager, producerId);
        }

        const arableAreaDecreased = decimalToBigInt(arableArea) < decimalToBigInt(farm.arableArea);

        if (arableAreaDecreased) {
          await this.ensureArableAreaSupportsPlantings(manager, farm.id, arableArea);
        }

        const data: UpdateFarmDto = {
          ...updateFarmDto,
        };

        if (data.totalArea !== undefined) {
          data.totalArea = totalArea;
        }

        if (data.arableArea !== undefined) {
          data.arableArea = arableArea;
        }

        if (data.vegetationArea !== undefined) {
          data.vegetationArea = vegetationArea;
        }

        if (!this.hasChanges(farm, data)) {
          return farm;
        }

        const repository = manager.getRepository(Farm);
        repository.merge(farm, data);

        return repository.save(farm);
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const farm = await this.findOne(id);

    await this.farmRepository.remove(farm);
  }

  private async findAndLockFarm(manager: EntityManager, id: string): Promise<Farm> {
    const farm = await manager
      .getRepository(Farm)
      .createQueryBuilder('farm')
      .where('farm.id = :id', {
        id,
      })
      .setLock('pessimistic_write')
      .getOne();

    if (!farm) {
      throw new NotFoundException('Farm not found');
    }

    return farm;
  }

  private async ensureProducerExists(manager: EntityManager, producerId: string): Promise<void> {
    const producer = await manager.getRepository(Producer).findOne({
      where: {
        id: producerId,
      },
    });

    if (!producer) {
      throw new NotFoundException('Producer not found');
    }
  }

  private async ensureArableAreaSupportsPlantings(
    manager: EntityManager,
    farmId: string,
    arableArea: string,
  ): Promise<void> {
    const result = await manager
      .getRepository(Planting)
      .createQueryBuilder('planting')
      .innerJoin('planting.cropSeason', 'cropSeason')
      .select('SUM(planting.plantedAreaHa)', 'total')
      .where('cropSeason.farmId = :farmId', {
        farmId,
      })
      .groupBy('cropSeason.id')
      .orderBy('SUM(planting.plantedAreaHa)', 'DESC')
      .limit(1)
      .getRawOne<{
        total: string;
      }>();

    const greatestPlantedArea = decimalToBigInt(result?.total ?? '0');
    const newArableArea = decimalToBigInt(arableArea);

    if (greatestPlantedArea > newArableArea) {
      throw new BadRequestException('Arable area cannot be smaller than the planted area of an existing crop season');
    }
  }

  private hasChanges(farm: Farm, data: UpdateFarmDto): boolean {
    return Object.entries(data).some(([key, value]) => value !== undefined && farm[key as keyof Farm] !== value);
  }

  private handleDatabaseError(error: unknown): never {
    const code = getDatabaseErrorCode(error);

    if (code === POSTGRES_ERROR.FOREIGN_KEY_VIOLATION) {
      throw new ConflictException('The related producer no longer exists');
    }

    throw error;
  }
}
