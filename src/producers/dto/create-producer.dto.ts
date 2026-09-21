import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';

import { DocumentType } from '@common/enums/document-type.enum.js';
import { IsCPForCNPJ } from '@common/decorators/is-cpf-or-cnpj.decorator.js';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProducerDto {
  @ApiProperty({
    example: '52998224725',
    description: 'CPF or CNPJ. Formatting characters are accepted.',
  })
  @IsString()
  @IsNotEmpty()
  @IsCPForCNPJ({
    message: 'O documento informado não é válido!',
  })
  document: string;

  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.CPF,
    description: 'Document type',
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({
    example: 'John Doe',
    description: 'Producer name',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  name: string;
}
