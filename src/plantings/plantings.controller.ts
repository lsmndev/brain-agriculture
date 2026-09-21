import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CreatePlantingDto } from './dto/create-planting.dto.js';
import { PlantingResponseDto } from './dto/planting-response.dto.js';
import { UpdatePlantingDto } from './dto/update-planting.dto.js';
import { PlantingsService } from './plantings.service.js';

@ApiTags('Plantings')
@Controller('plantings')
export class PlantingsController {
  constructor(private readonly plantingsService: PlantingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a planting' })
  @ApiCreatedResponse({
    description: 'Planting created successfully.',
    type: PlantingResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid planting data or planted area exceeds the farm arable area.',
  })
  @ApiNotFoundResponse({
    description: 'Crop season or crop not found.',
  })
  @ApiConflictResponse({
    description: 'The crop is already registered in this crop season.',
  })
  create(@Body() createPlantingDto: CreatePlantingDto) {
    return this.plantingsService.create(createPlantingDto);
  }

  @Get()
  @ApiOperation({ summary: 'List plantings' })
  @ApiOkResponse({
    description: 'Plantings returned successfully.',
    type: PlantingResponseDto,
    isArray: true,
  })
  findAll() {
    return this.plantingsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a planting by ID' })
  @ApiParam({
    name: 'id',
    description: 'Planting UUID.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Planting returned successfully.',
    type: PlantingResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid planting UUID.',
  })
  @ApiNotFoundResponse({
    description: 'Planting not found.',
  })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.plantingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a planting' })
  @ApiParam({
    name: 'id',
    description: 'Planting UUID.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Planting updated successfully.',
    type: PlantingResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid planting data, UUID or planted area exceeds the farm arable area.',
  })
  @ApiNotFoundResponse({
    description: 'Planting, crop season or crop not found.',
  })
  @ApiConflictResponse({
    description: 'The crop is already registered in this crop season.',
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updatePlantingDto: UpdatePlantingDto,
  ) {
    return this.plantingsService.update(id, updatePlantingDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a planting' })
  @ApiParam({
    name: 'id',
    description: 'Planting UUID.',
    format: 'uuid',
  })
  @ApiNoContentResponse({
    description: 'Planting deleted successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid planting UUID.',
  })
  @ApiNotFoundResponse({
    description: 'Planting not found.',
  })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.plantingsService.remove(id);
  }
}