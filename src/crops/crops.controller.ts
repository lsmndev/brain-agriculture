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

import { CreateCropDto } from './dto/create-crop.dto.js';
import { CropResponseDto } from './dto/crop-response.dto.js';
import { UpdateCropDto } from './dto/update-crop.dto.js';
import { CropsService } from './crops.service.js';

@ApiTags('Crops')
@Controller('crops')
export class CropsController {
  constructor(private readonly cropsService: CropsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a crop' })
  @ApiCreatedResponse({
    description: 'Crop created successfully.',
    type: CropResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid crop data.',
  })
  @ApiConflictResponse({
    description: 'A crop with this name already exists.',
  })
  create(@Body() createCropDto: CreateCropDto) {
    return this.cropsService.create(createCropDto);
  }

  @Get()
  @ApiOperation({ summary: 'List crops' })
  @ApiOkResponse({
    description: 'Crops returned successfully.',
    type: CropResponseDto,
    isArray: true,
  })
  findAll() {
    return this.cropsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a crop by ID' })
  @ApiParam({
    name: 'id',
    description: 'Crop UUID.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Crop returned successfully.',
    type: CropResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid crop UUID.',
  })
  @ApiNotFoundResponse({
    description: 'Crop not found.',
  })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.cropsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a crop' })
  @ApiParam({
    name: 'id',
    description: 'Crop UUID.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Crop updated successfully.',
    type: CropResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid crop data or UUID.',
  })
  @ApiNotFoundResponse({
    description: 'Crop not found.',
  })
  @ApiConflictResponse({
    description: 'A crop with this name already exists.',
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateCropDto: UpdateCropDto,
  ) {
    return this.cropsService.update(id, updateCropDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a crop' })
  @ApiParam({
    name: 'id',
    description: 'Crop UUID.',
    format: 'uuid',
  })
  @ApiNoContentResponse({
    description: 'Crop deleted successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid crop UUID.',
  })
  @ApiNotFoundResponse({
    description: 'Crop not found.',
  })
  @ApiConflictResponse({
    description: 'Crop cannot be deleted while it is used by existing plantings.',
  })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.cropsService.remove(id);
  }
}