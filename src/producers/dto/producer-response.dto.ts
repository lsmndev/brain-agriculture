import { ApiProperty } from '@nestjs/swagger';

import { DocumentType } from '@common/enums/document-type.enum.js';

export class ProducerResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique producer identifier.',
  })
  id: string;

  @ApiProperty({
    example: '52998224725',
    description: 'Normalized CPF or CNPJ containing digits only.',
  })
  document: string;

  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.CPF,
    description: 'Type of producer document.',
  })
  documentType: DocumentType;

  @ApiProperty({
    example: 'John Doe',
    description: 'Producer name.',
  })
  name: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-09-20T12:00:00.000Z',
    description: 'Date and time when the producer was created.',
  })
  createdAt: Date;

  @ApiProperty({
    format: 'date-time',
    example: '2026-09-20T12:00:00.000Z',
    description: 'Date and time when the producer was last updated.',
  })
  updatedAt: Date;
}