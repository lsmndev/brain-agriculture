import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { DashboardTotalsResponseDto } from './dto/dashboard-totals-response.dto.js';
import { FarmsByStateResponseDto } from './dto/farms-by-state-response.dto.js';
import { LandUseResponseDto } from './dto/land-use-response.dto.js';
import { PlantingsByCropResponseDto } from './dto/plantings-by-crop-response.dto.js';
import { DashboardsService } from './dashboards.service.js';

@ApiTags('Dashboards')
@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('totals')
  @ApiOperation({ summary: 'Get farm totals' })
  @ApiOkResponse({
    description: 'Farm totals returned successfully.',
    type: DashboardTotalsResponseDto,
  })
  getTotals() {
    return this.dashboardsService.getTotals();
  }

  @Get('by-state')
  @ApiOperation({ summary: 'Get farms grouped by state' })
  @ApiOkResponse({
    description: 'Farms grouped by state returned successfully.',
    type: FarmsByStateResponseDto,
    isArray: true,
  })
  getFarmsByState() {
    return this.dashboardsService.getFarmsByState();
  }

  @Get('by-crop')
  @ApiOperation({ summary: 'Get plantings grouped by crop' })
  @ApiOkResponse({
    description: 'Plantings grouped by crop returned successfully.',
    type: PlantingsByCropResponseDto,
    isArray: true,
  })
  getPlantingsByCrop() {
    return this.dashboardsService.getPlantingsByCrop();
  }

  @Get('land-use')
  @ApiOperation({ summary: 'Get land use totals' })
  @ApiOkResponse({
    description: 'Land use totals returned successfully.',
    type: LandUseResponseDto,
  })
  getLandUse() {
    return this.dashboardsService.getLandUse();
  }
}