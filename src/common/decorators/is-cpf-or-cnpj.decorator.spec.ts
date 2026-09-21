import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { DocumentType } from '../enums/document-type.enum.js';
import { IsCPForCNPJ } from './is-cpf-or-cnpj.decorator.js';

class TestDto {
  documentType?: DocumentType;

  @IsCPForCNPJ()
  document!: unknown;
}

class TestDtoWithMessage {
  documentType?: DocumentType;

  @IsCPForCNPJ({
    message: 'Documento inválido.',
  })
  document!: unknown;
}

describe('IsCPForCNPJ', () => {
  it('should accept a valid CPF', async () => {
    const dto = new TestDto();

    dto.documentType = DocumentType.CPF;
    dto.document = '52998224725';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject an invalid CPF', async () => {
    const dto = new TestDto();

    dto.documentType = DocumentType.CPF;
    dto.document = '11111111111';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);

    expect(errors[0]?.constraints?.isCPForCNPJ).toBe('CPF inválido.');
  });

  it('should accept a valid CNPJ', async () => {
    const dto = new TestDto();

    dto.documentType = DocumentType.CNPJ;
    dto.document = '11222333000181';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject an invalid CNPJ', async () => {
    const dto = new TestDto();

    dto.documentType = DocumentType.CNPJ;
    dto.document = '11111111111111';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);

    expect(errors[0]?.constraints?.isCPForCNPJ).toBe('CNPJ inválido.');
  });

  it('should reject when document is not a string', async () => {
    const dto = new TestDto();

    dto.documentType = DocumentType.CPF;
    dto.document = 52998224725;

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
  });

  it('should accept a string when documentType is not provided', async () => {
    const dto = new TestDto();

    dto.document = '52998224725';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject an unsupported document type', async () => {
    const dto = new TestDto();

    dto.documentType = 'INVALID' as DocumentType;

    dto.document = '52998224725';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);

    expect(errors[0]?.constraints?.isCPForCNPJ).toBe('INVALID inválido.');
  });

  it('should use CPF/CNPJ in the default message when documentType is not provided', async () => {
    const dto = new TestDto();

    dto.document = 123;

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);

    expect(errors[0]?.constraints?.isCPForCNPJ).toBe('CPF/CNPJ inválido.');
  });

  it('should use the custom validation message', async () => {
    const dto = new TestDtoWithMessage();

    dto.documentType = DocumentType.CPF;

    dto.document = '11111111111';

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);

    expect(errors[0]?.constraints?.isCPForCNPJ).toBe('Documento inválido.');
  });
});
