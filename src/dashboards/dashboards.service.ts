import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { normalizeDecimal } from '@common/utils/decimal.util.js';
import { Farm } from '@farms/entities/farm.entity.js';
import { Planting } from '@plantings/entities/planting.entity.js';
import { DashboardTotalsResponseDto } from './dto/dashboard-totals-response.dto.js';
import { FarmsByStateResponseDto } from './dto/farms-by-state-response.dto.js';
import { PlantingsByCropResponseDto } from './dto/plantings-by-crop-response.dto.js';
import { LandUseResponseDto } from './dto/land-use-response.dto.js';

@Injectable()
export class DashboardsService {
  constructor(private readonly dataSource: DataSource) {}

  async getTotals(): Promise<DashboardTotalsResponseDto> {
    const result = await this.dataSource
      .getRepository(Farm)
      .createQueryBuilder('farm')
      .select('COUNT(farm.id)', 'totalFarms')
      .addSelect('COALESCE(SUM(farm.totalArea), 0)', 'totalHectares')
      .getRawOne<{
        totalFarms: string;
        totalHectares: string;
      }>();

    return {
      totalFarms: Number(result?.totalFarms ?? 0),
      totalHectares: normalizeDecimal(result?.totalHectares ?? '0'),
    };
  }

  async getFarmsByState(): Promise<FarmsByStateResponseDto[]> {
    const results = await this.dataSource
      .getRepository(Farm)
      .createQueryBuilder('farm')
      .select('farm.state', 'state')
      .addSelect('COUNT(farm.id)', 'total')
      .groupBy('farm.state')
      .orderBy('farm.state', 'ASC')
      .getRawMany<{
        state: string;
        total: string;
      }>();

    return results.map((result) => ({
      state: result.state,
      total: Number(result.total),
    }));
  }

  async getPlantingsByCrop(): Promise<PlantingsByCropResponseDto[]> {
    const results = await this.dataSource
      .getRepository(Planting)
      .createQueryBuilder('planting')
      .innerJoin('planting.crop', 'crop')
      .select('crop.id', 'cropId')
      .addSelect('crop.name', 'cropName')
      .addSelect('COUNT(planting.id)', 'totalPlantings')
      .addSelect('COALESCE(SUM(planting.plantedAreaHa), 0)', 'plantedAreaHa')
      .groupBy('crop.id')
      .addGroupBy('crop.name')
      .orderBy('crop.name', 'ASC')
      .getRawMany<{
        cropId: string;
        cropName: string;
        totalPlantings: string;
        plantedAreaHa: string;
      }>();

    return results.map((result) => ({
      cropId: result.cropId,
      cropName: result.cropName,
      totalPlantings: Number(result.totalPlantings),
      plantedAreaHa: normalizeDecimal(result.plantedAreaHa),
    }));
  }

  async getLandUse(): Promise<LandUseResponseDto> {
    const result = await this.dataSource
      .getRepository(Farm)
      .createQueryBuilder('farm')
      .select('COALESCE(SUM(farm.arableArea), 0)', 'arableAreaHa')
      .addSelect('COALESCE(SUM(farm.vegetationArea), 0)', 'vegetationAreaHa')
      .getRawOne<{
        arableAreaHa: string;
        vegetationAreaHa: string;
      }>();

    return {
      arableAreaHa: normalizeDecimal(result?.arableAreaHa ?? '0'),
      vegetationAreaHa: normalizeDecimal(result?.vegetationAreaHa ?? '0'),
    };
  }
}
