import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { decimalToBigInt, normalizeDecimal } from '@common/utils/decimal.util.js';
import { CropSeason } from '@crop-seasons/entities/crop-season.entity.js';
import { Crop } from '@crops/entities/crop.entity.js';
import { Farm } from '@farms/entities/farm.entity.js';

import { CreatePlantingDto } from './dto/create-planting.dto.js';
import { UpdatePlantingDto } from './dto/update-planting.dto.js';
import { Planting } from './entities/planting.entity.js';
import { getDatabaseErrorCode, POSTGRES_ERROR } from '@common/database/database-error.util.js';

@Injectable()
export class PlantingsService {
  constructor(
    @InjectRepository(Planting)
    private readonly plantingRepository: Repository<Planting>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createPlantingDto: CreatePlantingDto): Promise<Planting> {
    const plantedAreaHa = normalizeDecimal(createPlantingDto.plantedAreaHa);

    this.validatePlantedArea(plantedAreaHa);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const cropSeason = await this.findCropSeason(manager, createPlantingDto.cropSeasonId);
        const farm = await this.findAndLockFarm(manager, cropSeason.farmId);
        await this.ensureCropExists(manager, createPlantingDto.cropId);
        await this.ensurePlantingIsUnique(manager, createPlantingDto.cropSeasonId, createPlantingDto.cropId);
        await this.ensureAreaIsAvailable(manager, cropSeason.id, farm.arableArea, plantedAreaHa);

        const repository = manager.getRepository(Planting);

        const planting = repository.create({
          cropSeasonId: createPlantingDto.cropSeasonId,
          cropId: createPlantingDto.cropId,
          plantedAreaHa,
        });

        return repository.save(planting);
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAll(): Promise<Planting[]> {
    return this.plantingRepository.find({
      relations: {
        cropSeason: true,
        crop: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Planting> {
    const planting = await this.plantingRepository.findOne({
      where: {
        id,
      },
      relations: {
        cropSeason: true,
        crop: true,
      },
    });

    if (!planting) {
      throw new NotFoundException(`Planting with id "${id}" not found`);
    }

    return planting;
  }

  async update(id: string, updatePlantingDto: UpdatePlantingDto): Promise<Planting> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(Planting);

        const current = await repository.findOne({
          where: {
            id,
          },
        });

        if (!current) {
          throw new NotFoundException(`Planting with id "${id}" not found`);
        }

        const cropSeasonId = updatePlantingDto.cropSeasonId ?? current.cropSeasonId;
        const cropId = updatePlantingDto.cropId ?? current.cropId;
        const plantedAreaHa =
          updatePlantingDto.plantedAreaHa !== undefined
            ? normalizeDecimal(updatePlantingDto.plantedAreaHa)
            : normalizeDecimal(current.plantedAreaHa);

        this.validatePlantedArea(plantedAreaHa);

        const sameCropSeason = cropSeasonId === current.cropSeasonId;
        const sameCrop = cropId === current.cropId;
        const sameArea = plantedAreaHa === normalizeDecimal(current.plantedAreaHa);

        if (sameCropSeason && sameCrop && sameArea) {
          return current;
        }

        const currentCropSeason = await this.findCropSeason(manager, current.cropSeasonId);
        const targetCropSeason = sameCropSeason ? currentCropSeason : await this.findCropSeason(manager, cropSeasonId);
        const farmIds = [currentCropSeason.farmId, targetCropSeason.farmId]
          .filter((farmId, index, values) => values.indexOf(farmId) === index)
          .sort();
        const lockedFarms = new Map<string, Farm>();

        for (const farmId of farmIds) {
          const farm = await this.findAndLockFarm(manager, farmId);
          lockedFarms.set(farm.id, farm);
        }

        const targetFarm = lockedFarms.get(targetCropSeason.farmId);

        if (!targetFarm) {
          throw new NotFoundException(`Farm with id "${targetCropSeason.farmId}" not found`);
        }

        if (!sameCrop) {
          await this.ensureCropExists(manager, cropId);
        }

        if (!sameCropSeason || !sameCrop) {
          await this.ensurePlantingIsUnique(manager, cropSeasonId, cropId, id);
        }

        await this.ensureAreaIsAvailable(
          manager,
          targetCropSeason.id,
          targetFarm.arableArea,
          plantedAreaHa,
          sameCropSeason ? id : undefined,
        );

        repository.merge(current, {
          cropSeasonId,
          cropId,
          plantedAreaHa,
        });

        return repository.save(current);
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const planting = await this.findOne(id);
    await this.plantingRepository.remove(planting);
  }

  private async findCropSeason(manager: EntityManager, id: string): Promise<CropSeason> {
    const cropSeason = await manager.getRepository(CropSeason).findOne({
      where: {
        id,
      },
    });

    if (!cropSeason) {
      throw new NotFoundException(`Crop season with id "${id}" not found`);
    }

    return cropSeason;
  }

  private async findAndLockFarm(manager: EntityManager, farmId: string): Promise<Farm> {
    const farm = await manager
      .getRepository(Farm)
      .createQueryBuilder('farm')
      .where('farm.id = :farmId', {
        farmId,
      })
      .setLock('pessimistic_write')
      .getOne();

    if (!farm) {
      throw new NotFoundException(`Farm with id "${farmId}" not found`);
    }

    return farm;
  }

  private async ensureCropExists(manager: EntityManager, cropId: string): Promise<void> {
    const crop = await manager.getRepository(Crop).findOne({
      where: {
        id: cropId,
      },
    });

    if (!crop) {
      throw new NotFoundException(`Crop with id "${cropId}" not found`);
    }
  }

  private async ensurePlantingIsUnique(
    manager: EntityManager,
    cropSeasonId: string,
    cropId: string,
    ignoreId?: string,
  ): Promise<void> {
    const repository = manager.getRepository(Planting);

    const query = repository
      .createQueryBuilder('planting')
      .where('planting.cropSeasonId = :cropSeasonId', {
        cropSeasonId,
      })
      .andWhere('planting.cropId = :cropId', {
        cropId,
      });

    if (ignoreId) {
      query.andWhere('planting.id != :ignoreId', {
        ignoreId,
      });
    }

    const existing = await query.getOne();

    if (existing) {
      throw new ConflictException('This crop is already registered in this crop season');
    }
  }

  private async ensureAreaIsAvailable(
    manager: EntityManager,
    cropSeasonId: string,
    arableArea: string,
    plantedAreaHa: string,
    ignorePlantingId?: string,
  ): Promise<void> {
    const repository = manager.getRepository(Planting);

    const query = repository
      .createQueryBuilder('planting')
      .select('COALESCE(SUM(planting.plantedAreaHa), 0)', 'total')
      .where('planting.cropSeasonId = :cropSeasonId', {
        cropSeasonId,
      });

    if (ignorePlantingId) {
      query.andWhere('planting.id != :ignorePlantingId', {
        ignorePlantingId,
      });
    }

    const result = await query.getRawOne<{
      total: string;
    }>();
    const currentTotal = decimalToBigInt(result?.total ?? '0');
    const newArea = decimalToBigInt(plantedAreaHa);
    const availableArea = decimalToBigInt(arableArea);

    if (currentTotal + newArea > availableArea) {
      throw new BadRequestException('The total planted area cannot exceed the farm arable area');
    }
  }

  private validatePlantedArea(plantedAreaHa: string): void {
    const area = decimalToBigInt(plantedAreaHa);

    if (area <= 0n) {
      throw new BadRequestException('Planted area must be greater than zero');
    }
  }

  private handleDatabaseError(error: unknown): never {
    const code = getDatabaseErrorCode(error);

    if (code === POSTGRES_ERROR.UNIQUE_VIOLATION) {
      throw new ConflictException('This crop is already planted in this crop season');
    }

    throw error;
  }
}
