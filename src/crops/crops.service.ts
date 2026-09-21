import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { CreateCropDto } from './dto/create-crop.dto.js';
import { UpdateCropDto } from './dto/update-crop.dto.js';
import { Crop } from './entities/crop.entity.js';
import { getDatabaseErrorCode, POSTGRES_ERROR } from '@common/database/database-error.util.js';

@Injectable()
export class CropsService {
  constructor(
    @InjectRepository(Crop)
    private readonly cropRepository: Repository<Crop>,
  ) {}

  async create(createCropDto: CreateCropDto): Promise<Crop> {
    const name = this.normalizeName(createCropDto.name);

    await this.ensureNameIsUnique(name);

    const crop = this.cropRepository.create({
      ...createCropDto,
      name,
    });

    return this.saveCrop(crop);
  }

  async findAll(): Promise<Crop[]> {
    return this.cropRepository.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Crop> {
    const crop = await this.cropRepository.findOne({
      where: {
        id,
      },
    });

    if (!crop) {
      throw new NotFoundException('Crop not found');
    }

    return crop;
  }

  async update(id: string, updateCropDto: UpdateCropDto): Promise<Crop> {
    const crop = await this.findOne(id);

    const data: UpdateCropDto = {
      ...updateCropDto,
    };

    if (data.name !== undefined) {
      data.name = this.normalizeName(data.name);

      if (!this.isSameName(data.name, crop.name)) {
        await this.ensureNameIsUnique(data.name);
      }
    }

    if (!this.hasChanges(crop, data)) {
      return crop;
    }

    this.cropRepository.merge(crop, data);

    return this.saveCrop(crop);
  }

  async remove(id: string): Promise<void> {
    const crop = await this.findOne(id);

    try {
      await this.cropRepository.remove(crop);
    } catch (error) {
      if (getDatabaseErrorCode(error) === POSTGRES_ERROR.FOREIGN_KEY_VIOLATION) {
        throw new ConflictException('Cannot delete a crop that is used by existing plantings');
      }

      throw error;
    }
  }

  private async ensureNameIsUnique(name: string): Promise<void> {
    const crop = await this.cropRepository.findOne({
      where: {
        name: ILike(name),
      },
    });

    if (crop) {
      throw new ConflictException('A crop with this name already exists');
    }
  }

  private normalizeName(name: string): string {
    return name.trim();
  }

  private isSameName(firstName: string, secondName: string): boolean {
    return firstName.toLowerCase() === secondName.toLowerCase();
  }

  private hasChanges(crop: Crop, data: UpdateCropDto): boolean {
    return Object.entries(data).some(([key, value]) => value !== undefined && crop[key as keyof Crop] !== value);
  }

  private async saveCrop(crop: Crop): Promise<Crop> {
    try {
      return await this.cropRepository.save(crop);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  private handleDatabaseError(error: unknown): never {
    const code = getDatabaseErrorCode(error);

    if (code === POSTGRES_ERROR.UNIQUE_VIOLATION) {
      throw new ConflictException('A crop with this name already exists');
    }

    throw error;
  }
}
