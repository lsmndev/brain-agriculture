import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { DashboardTotalsDto, FarmsByStateDto, LandUseDto, PlantingsByCropDto } from './dto/dashboard-totals-response.dto.js';
import { DashboardsController } from './dashboards.controller.js';
import { DashboardsService } from './dashboards.service.js';

describe('DashboardsController', () => {
  let controller: DashboardsController;

  const dashboardsServiceMock = {
    getTotals: vi.fn(),
    getFarmsByState: vi.fn(),
    getPlantingsByCrop: vi.fn(),
    getLandUse: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardsController],
      providers: [
        {
          provide: DashboardsService,
          useValue: dashboardsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<DashboardsController>(DashboardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTotals', () => {
    it('should return dashboard totals', async () => {
      const result: DashboardTotalsDto = {
        totalFarms: 10,
        totalHectares: '5000.5000',
      };

      dashboardsServiceMock.getTotals.mockResolvedValue(result);

      await expect(controller.getTotals()).resolves.toEqual(result);

      expect(dashboardsServiceMock.getTotals).toHaveBeenCalledOnce();
      expect(dashboardsServiceMock.getTotals).toHaveBeenCalledWith();
    });
  });

  describe('getFarmsByState', () => {
    it('should return farms grouped by state', async () => {
      const result: FarmsByStateDto[] = [
        {
          state: 'MG',
          total: 5,
        },
        {
          state: 'SP',
          total: 3,
        },
      ];

      dashboardsServiceMock.getFarmsByState.mockResolvedValue(result);

      await expect(controller.getFarmsByState()).resolves.toEqual(result);

      expect(dashboardsServiceMock.getFarmsByState).toHaveBeenCalledOnce();
      expect(dashboardsServiceMock.getFarmsByState).toHaveBeenCalledWith();
    });
  });

  describe('getPlantingsByCrop', () => {
    it('should return plantings grouped by crop', async () => {
      const result: PlantingsByCropDto[] = [
        {
          cropId: '11111111-1111-4111-8111-111111111111',
          cropName: 'Soybean',
          totalPlantings: 5,
          plantedAreaHa: '1200.5000',
        },
        {
          cropId: '22222222-2222-4222-8222-222222222222',
          cropName: 'Corn',
          totalPlantings: 3,
          plantedAreaHa: '800.2500',
        },
      ];

      dashboardsServiceMock.getPlantingsByCrop.mockResolvedValue(result);

      await expect(controller.getPlantingsByCrop()).resolves.toEqual(result);

      expect(dashboardsServiceMock.getPlantingsByCrop).toHaveBeenCalledOnce();
      expect(dashboardsServiceMock.getPlantingsByCrop).toHaveBeenCalledWith();
    });
  });

  describe('getLandUse', () => {
    it('should return land use totals', async () => {
      const result: LandUseDto = {
        arableAreaHa: '3500.5000',
        vegetationAreaHa: '1500.0000',
      };

      dashboardsServiceMock.getLandUse.mockResolvedValue(result);

      await expect(controller.getLandUse()).resolves.toEqual(result);

      expect(dashboardsServiceMock.getLandUse).toHaveBeenCalledOnce();
      expect(dashboardsServiceMock.getLandUse).toHaveBeenCalledWith();
    });
  });
});
