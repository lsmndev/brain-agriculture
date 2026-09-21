import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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

import { CreateProducerDto } from './dto/create-producer.dto.js';
import { UpdateProducerDto } from './dto/update-producer.dto.js';
import { Producer } from './entities/producer.entity.js';
import { ProducersService } from './producers.service.js';

import { ProducerResponseDto } from './dto/producer-response.dto.js';

@ApiTags('Producers')
@Controller('producers')
export class ProducersController {
  constructor(private readonly producersService: ProducersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a producer' })
  @ApiCreatedResponse({
    description: 'Producer created successfully.',
    type: ProducerResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid producer data or document.',
  })
  @ApiConflictResponse({
    description: 'A producer with the same CPF/CNPJ already exists.',
  })
  create(@Body() createProducerDto: CreateProducerDto): Promise<Producer> {
    return this.producersService.create(createProducerDto);
  }

  @Get()
  @ApiOperation({ summary: 'List producers' })
  @ApiOkResponse({
    description: 'Producers returned successfully.',
    type: ProducerResponseDto,
    isArray: true,
  })
  findAll(): Promise<Producer[]> {
    return this.producersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a producer by ID' })
  @ApiParam({
    name: 'id',
    description: 'Producer UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Producer returned successfully.',
    type: ProducerResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Producer not found.',
  })
  findOne(@Param('id') id: string): Promise<Producer> {
    return this.producersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a producer' })
  @ApiParam({
    name: 'id',
    description: 'Producer UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Producer updated successfully.',
    type: ProducerResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid producer data or document.',
  })
  @ApiNotFoundResponse({
    description: 'Producer not found.',
  })
  @ApiConflictResponse({
    description: 'A producer with the same CPF/CNPJ already exists.',
  })
  update(
    @Param('id') id: string,
    @Body() updateProducerDto: UpdateProducerDto,
  ): Promise<Producer> {
    return this.producersService.update(id, updateProducerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a producer' })
  @ApiParam({
    name: 'id',
    description: 'Producer UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiNoContentResponse({
    description: 'Producer deleted successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Producer not found.',
  })
  @ApiConflictResponse({
    description: 'Producer cannot be deleted while it has registered farms.',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.producersService.remove(id);
  }
}