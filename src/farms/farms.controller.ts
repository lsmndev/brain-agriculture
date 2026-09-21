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

import { CreateFarmDto } from './dto/create-farm.dto.js';
import { FarmResponseDto } from './dto/farm-response.dto.js';
import { UpdateFarmDto } from './dto/update-farm.dto.js';
import { FarmsService } from './farms.service.js';

@ApiTags('Farms')
@Controller('farms')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a farm' })
  @ApiCreatedResponse({
    description: 'Farm created successfully.',
    type: FarmResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid farm data or area values.',
  })
  @ApiNotFoundResponse({
    description: 'Producer not found.',
  })
  @ApiConflictResponse({
    description: 'The related producer no longer exists.',
  })
  create(@Body() createFarmDto: CreateFarmDto) {
    return this.farmsService.create(createFarmDto);
  }

  @Get()
  @ApiOperation({ summary: 'List farms' })
  @ApiOkResponse({
    description: 'Farms returned successfully.',
    type: FarmResponseDto,
    isArray: true,
  })
  findAll() {
    return this.farmsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a farm by ID' })
  @ApiParam({
    name: 'id',
    description: 'Farm UUID.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Farm returned successfully.',
    type: FarmResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid farm UUID.',
  })
  @ApiNotFoundResponse({
    description: 'Farm not found.',
  })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.farmsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a farm' })
  @ApiParam({
    name: 'id',
    description: 'Farm UUID.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Farm updated successfully.',
    type: FarmResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid farm data, UUID or area values.',
  })
  @ApiNotFoundResponse({
    description: 'Farm or producer not found.',
  })
  @ApiConflictResponse({
    description: 'The related producer no longer exists.',
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateFarmDto: UpdateFarmDto,
  ) {
    return this.farmsService.update(id, updateFarmDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a farm' })
  @ApiParam({
    name: 'id',
    description: 'Farm UUID.',
    format: 'uuid',
  })
  @ApiNoContentResponse({
    description: 'Farm deleted successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid farm UUID.',
  })
  @ApiNotFoundResponse({
    description: 'Farm not found.',
  })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.farmsService.remove(id);
  }
}