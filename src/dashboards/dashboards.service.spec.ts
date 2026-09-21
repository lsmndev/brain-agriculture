import { DataSource } from 'typeorm';
import { beforeEach, describe, expect, it } from 'vitest';

import { Farm } from '@farms/entities/farm.entity.js';
import { Planting } from '@plantings/entities/planting.entity.js';
import { makeQueryBuilderMock, type MockQueryBuilder } from '@tests/mocks/query-builder.mock.js';

import { DashboardsService } from './dashboards.service.js';

describe('DashboardsService', () => {
  let service: DashboardsService;
  let queryBuilder: MockQueryBuilder;

  let dataSource: {
    getRepository: ReturnType<typeof vi.fn>;
  };

  let farmRepository: {
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };

  let plantingRepository: {
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    queryBuilder = makeQueryBuilderMock();

    farmRepository = {
      createQueryBuilder: vi.fn().mockReturnValue(queryBuilder),
    };

    plantingRepository = {
      createQueryBuilder: vi.fn().mockReturnValue(queryBuilder),
    };

    dataSource = {
      getRepository: vi.fn((entity: unknown) => {
        if (entity === Farm) {
          return farmRepository;
        }

        if (entity === Planting) {
          return plantingRepository;
        }

        throw new Error('Unexpected repository');
      }),
    };

    service = new DashboardsService(dataSource as unknown as DataSource);
  });

  describe('getTotals', () => {
    it('should return total farms and total hectares', async () => {
      queryBuilder.getRawOne.mockResolvedValue({
        totalFarms: '12',
        totalHectares: '18540.7500',
      });

      const result = await service.getTotals();

      expect(result).toEqual({
        totalFarms: 12,
        totalHectares: '18540.7500',
      });
      expect(dataSource.getRepository).toHaveBeenCalledWith(Farm);
      expect(farmRepository.createQueryBuilder).toHaveBeenCalledWith('farm');
      expect(queryBuilder.select).toHaveBeenCalledWith('COUNT(farm.id)', 'totalFarms');
      expect(queryBuilder.addSelect).toHaveBeenCalledWith('COALESCE(SUM(farm.totalArea), 0)', 'totalHectares');
    });

    it.each([
      ['zero values', { totalFarms: '0', totalHectares: '0' }],
      ['undefined result', undefined],
    ])('should return zero values for %s', async (_, rawResult) => {
      queryBuilder.getRawOne.mockResolvedValue(rawResult);

      await expect(service.getTotals()).resolves.toEqual({
        totalFarms: 0,
        totalHectares: '0.0000',
      });
    });
  });

  describe('getFarmsByState', () => {
    it('should return farms grouped by state', async () => {
      queryBuilder.getRawMany.mockResolvedValue([
        { state: 'GO', total: '3' },
        { state: 'MG', total: '4' },
        { state: 'SP', total: '5' },
      ]);

      const result = await service.getFarmsByState();

      expect(result).toEqual([
        { state: 'GO', total: 3 },
        { state: 'MG', total: 4 },
        { state: 'SP', total: 5 },
      ]);
      expect(queryBuilder.groupBy).toHaveBeenCalledWith('farm.state');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('farm.state', 'ASC');
    });

    it('should return an empty array when there are no farms', async () => {
      queryBuilder.getRawMany.mockResolvedValue([]);

      await expect(service.getFarmsByState()).resolves.toEqual([]);
    });
  });

  describe('getPlantingsByCrop', () => {
    it('should return plantings grouped by crop', async () => {
      queryBuilder.getRawMany.mockResolvedValue([
        {
          cropId: '11111111-1111-4111-8111-111111111111',
          cropName: 'Corn',
          totalPlantings: '5',
          plantedAreaHa: '1250.5000',
        },
        {
          cropId: '22222222-2222-4222-8222-222222222222',
          cropName: 'Soybean',
          totalPlantings: '8',
          plantedAreaHa: '3100.7500',
        },
      ]);

      const result = await service.getPlantingsByCrop();

      expect(result).toEqual([
        {
          cropId: '11111111-1111-4111-8111-111111111111',
          cropName: 'Corn',
          totalPlantings: 5,
          plantedAreaHa: '1250.5000',
        },
        {
          cropId: '22222222-2222-4222-8222-222222222222',
          cropName: 'Soybean',
          totalPlantings: 8,
          plantedAreaHa: '3100.7500',
        },
      ]);
      expect(dataSource.getRepository).toHaveBeenCalledWith(Planting);
      expect(plantingRepository.createQueryBuilder).toHaveBeenCalledWith('planting');
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith('planting.crop', 'crop');
      expect(queryBuilder.groupBy).toHaveBeenCalledWith('crop.id');
      expect(queryBuilder.addGroupBy).toHaveBeenCalledWith('crop.name');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('crop.name', 'ASC');
    });

    it('should preserve planted area as string', async () => {
      queryBuilder.getRawMany.mockResolvedValue([
        {
          cropId: '11111111-1111-4111-8111-111111111111',
          cropName: 'Soybean',
          totalPlantings: '1',
          plantedAreaHa: '99999999999.9999',
        },
      ]);

      const [result] = await service.getPlantingsByCrop();

      expect(result.plantedAreaHa).toBe('99999999999.9999');
      expect(typeof result.plantedAreaHa).toBe('string');
    });

    it('should return an empty array when there are no plantings', async () => {
      queryBuilder.getRawMany.mockResolvedValue([]);

      await expect(service.getPlantingsByCrop()).resolves.toEqual([]);
    });
  });

  describe('getLandUse', () => {
    it('should return total arable and vegetation areas', async () => {
      queryBuilder.getRawOne.mockResolvedValue({
        arableAreaHa: '12350.5000',
        vegetationAreaHa: '6190.2500',
      });

      const result = await service.getLandUse();

      expect(result).toEqual({
        arableAreaHa: '12350.5000',
        vegetationAreaHa: '6190.2500',
      });
      expect(queryBuilder.select).toHaveBeenCalledWith('COALESCE(SUM(farm.arableArea), 0)', 'arableAreaHa');
      expect(queryBuilder.addSelect).toHaveBeenCalledWith('COALESCE(SUM(farm.vegetationArea), 0)', 'vegetationAreaHa');
    });

    it.each([
      ['zero values', { arableAreaHa: '0', vegetationAreaHa: '0' }],
      ['undefined result', undefined],
    ])('should return zero values for %s', async (_, rawResult) => {
      queryBuilder.getRawOne.mockResolvedValue(rawResult);

      await expect(service.getLandUse()).resolves.toEqual({
        arableAreaHa: '0.0000',
        vegetationAreaHa: '0.0000',
      });
    });
  });
});
