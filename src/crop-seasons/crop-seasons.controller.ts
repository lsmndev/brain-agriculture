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

import { CreateCropSeasonDto } from './dto/create-crop-season.dto.js';
import { CropSeasonResponseDto } from './dto/crop-season-response.dto.js';
import { UpdateCropSeasonDto } from './dto/update-crop-season.dto.js';
import { CropSeasonsService } from './crop-seasons.service.js';

@ApiTags('Crop Seasons')
@Controller('crop-seasons')
export class CropSeasonsController {
  constructor(private readonly cropSeasonsService: CropSeasonsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a crop season' })
  @ApiCreatedResponse({
    description: 'Crop season created successfully.',
    type: CropSeasonResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid crop season data.',
  })
  @ApiNotFoundResponse({
    description: 'Farm not found.',
  })
  @ApiConflictResponse({
    description: 'A crop season already exists for this farm and year.',
  })
  create(@Body() createCropSeasonDto: CreateCropSeasonDto) {
    return this.cropSeasonsService.create(createCropSeasonDto);
  }

  @Get()
  @ApiOperation({ summary: 'List crop seasons' })
  @ApiOkResponse({
    description: 'Crop seasons returned successfully.',
    type: CropSeasonResponseDto,
    isArray: true,
  })
  findAll() {
    return this.cropSeasonsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a crop season by ID' })
  @ApiParam({
    name: 'id',
    description: 'Crop season UUID.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Crop season returned successfully.',
    type: CropSeasonResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid crop season UUID.',
  })
  @ApiNotFoundResponse({
    description: 'Crop season not found.',
  })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.cropSeasonsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a crop season' })
  @ApiParam({
    name: 'id',
    description: 'Crop season UUID.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Crop season updated successfully.',
    type: CropSeasonResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid crop season data, UUID or planted area exceeds the target farm arable area.',
  })
  @ApiNotFoundResponse({
    description: 'Crop season or farm not found.',
  })
  @ApiConflictResponse({
    description: 'A crop season already exists for this farm and year.',
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateCropSeasonDto: UpdateCropSeasonDto,
  ) {
    return this.cropSeasonsService.update(id, updateCropSeasonDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a crop season' })
  @ApiParam({
    name: 'id',
    description: 'Crop season UUID.',
    format: 'uuid',
  })
  @ApiNoContentResponse({
    description: 'Crop season deleted successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid crop season UUID.',
  })
  @ApiNotFoundResponse({
    description: 'Crop season not found.',
  })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.cropSeasonsService.remove(id);
  }
}