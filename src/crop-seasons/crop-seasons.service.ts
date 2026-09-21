import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { decimalToBigInt } from '@common/utils/decimal.util.js';
import { Farm } from '@farms/entities/farm.entity.js';
import { Planting } from '@plantings/entities/planting.entity.js';

import { CreateCropSeasonDto } from './dto/create-crop-season.dto.js';
import { UpdateCropSeasonDto } from './dto/update-crop-season.dto.js';
import { CropSeason } from './entities/crop-season.entity.js';
import { getDatabaseErrorCode, POSTGRES_ERROR } from '@common/database/database-error.util.js';

@Injectable()
export class CropSeasonsService {
  constructor(
    @InjectRepository(CropSeason)
    private readonly cropSeasonRepository: Repository<CropSeason>,

    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createCropSeasonDto: CreateCropSeasonDto): Promise<CropSeason> {
    await this.ensureFarmExists(createCropSeasonDto.farmId);
    await this.ensureSeasonIsUnique(createCropSeasonDto.farmId, createCropSeasonDto.year);

    const cropSeason = this.cropSeasonRepository.create(createCropSeasonDto);

    try {
      return await this.cropSeasonRepository.save(cropSeason);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAll(): Promise<CropSeason[]> {
    return this.cropSeasonRepository.find({
      order: {
        year: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<CropSeason> {
    const cropSeason = await this.cropSeasonRepository.findOne({
      where: {
        id,
      },
    });

    if (!cropSeason) {
      throw new NotFoundException('Crop season not found');
    }

    return cropSeason;
  }

  async update(id: string, updateCropSeasonDto: UpdateCropSeasonDto): Promise<CropSeason> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(CropSeason);

        const cropSeason = await repository.findOne({
          where: {
            id,
          },
        });

        if (!cropSeason) {
          throw new NotFoundException('Crop season not found');
        }

        const farmId = updateCropSeasonDto.farmId ?? cropSeason.farmId;
        const year = updateCropSeasonDto.year ?? cropSeason.year;
        const farmChanged = farmId !== cropSeason.farmId;
        const combinationChanged = farmChanged || year !== cropSeason.year;

        if (farmChanged) {
          const farmIds = [cropSeason.farmId, farmId].sort();
          const farms = new Map<string, Farm>();

          for (const farmIdToLock of farmIds) {
            const farm = await this.findAndLockFarm(manager, farmIdToLock);
            farms.set(farmIdToLock, farm);
          }

          const targetFarm = farms.get(farmId);

          if (!targetFarm) {
            throw new NotFoundException('Farm not found');
          }

          await this.ensurePlantingsFitFarm(manager, cropSeason.id, targetFarm.arableArea);
        }

        if (combinationChanged) {
          await this.ensureSeasonIsUnique(farmId, year, manager, cropSeason.id);
        }

        if (!this.hasChanges(cropSeason, updateCropSeasonDto)) {
          return cropSeason;
        }

        repository.merge(cropSeason, updateCropSeasonDto);

        return repository.save(cropSeason);
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string): Promise<void> {
    const cropSeason = await this.findOne(id);
    await this.cropSeasonRepository.remove(cropSeason);
  }

  private async ensureFarmExists(farmId: string): Promise<void> {
    const farm = await this.farmRepository.findOne({
      where: {
        id: farmId,
      },
    });

    if (!farm) {
      throw new NotFoundException('Farm not found');
    }
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
      throw new NotFoundException('Farm not found');
    }

    return farm;
  }

  private async ensureSeasonIsUnique(
    farmId: string,
    year: number,
    manager?: EntityManager,
    ignoreId?: string,
  ): Promise<void> {
    const repository = manager ? manager.getRepository(CropSeason) : this.cropSeasonRepository;

    if (!ignoreId) {
      const cropSeason = await repository.findOne({
        where: {
          farmId,
          year,
        },
      });

      if (cropSeason) {
        throw new ConflictException('A crop season already exists for this farm and year');
      }

      return;
    }

    const cropSeason = await repository
      .createQueryBuilder('cropSeason')
      .where('cropSeason.farmId = :farmId', {
        farmId,
      })
      .andWhere('cropSeason.year = :year', {
        year,
      })
      .andWhere('cropSeason.id != :ignoreId', {
        ignoreId,
      })
      .getOne();

    if (cropSeason) {
      throw new ConflictException('A crop season already exists for this farm and year');
    }
  }

  private async ensurePlantingsFitFarm(
    manager: EntityManager,
    cropSeasonId: string,
    arableArea: string,
  ): Promise<void> {
    const result = await manager
      .getRepository(Planting)
      .createQueryBuilder('planting')
      .select('COALESCE(SUM(planting.plantedAreaHa), 0)', 'total')
      .where('planting.cropSeasonId = :cropSeasonId', {
        cropSeasonId,
      })
      .getRawOne<{
        total: string;
      }>();

    const plantedArea = decimalToBigInt(result?.total ?? '0');
    const availableArea = decimalToBigInt(arableArea);

    if (plantedArea > availableArea) {
      throw new BadRequestException('The crop season planted area cannot exceed the target farm arable area');
    }
  }

  private hasChanges(cropSeason: CropSeason, data: UpdateCropSeasonDto): boolean {
    return Object.entries(data).some(
      ([key, value]) => value !== undefined && cropSeason[key as keyof CropSeason] !== value,
    );
  }

  private handleDatabaseError(error: unknown): never {
    const code = getDatabaseErrorCode(error);

    if (code === POSTGRES_ERROR.UNIQUE_VIOLATION) {
      throw new ConflictException('A crop season already exists for this farm and year');
    }

    if (code === POSTGRES_ERROR.FOREIGN_KEY_VIOLATION) {
      throw new ConflictException('The related farm no longer exists');
    }

    throw error;
  }
}
