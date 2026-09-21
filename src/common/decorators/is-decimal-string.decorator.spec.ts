import { validate, ValidationError } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { IsDecimalString } from './is-decimal-string.decorator.js';

class TestDto {
  @IsDecimalString()
  value: unknown;
}

class CustomMessageDto {
  @IsDecimalString({
    message: 'Invalid decimal',
  })
  value: unknown;
}

async function validateValue(value: unknown): Promise<ValidationError[]> {
  const dto = new TestDto();
  dto.value = value;

  return validate(dto);
}

describe('IsDecimalString', () => {
  describe('valid values', () => {
    it.each([
      '0',
      '1',
      '10',
      '12345678901',
      '0.1',
      '0.12',
      '0.123',
      '0.1234',
      '1.0000',
      '123.4567',
      '12345678901.1234',
      '-1',
      '-1.5',
      '-123.4567',
      '-12345678901.1234',
    ])('should accept "%s"', async (value) => {
      const errors = await validateValue(value);

      expect(errors).toHaveLength(0);
    });
  });

  describe('invalid decimal places', () => {
    it.each(['1.', '1.12345', '0.00000', '123.123456'])('should reject "%s"', async (value) => {
      const errors = await validateValue(value);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isDecimalString');
    });
  });

  describe('invalid integer precision', () => {
    it.each(['123456789012', '123456789012.1234', '-123456789012', '-123456789012.1234'])(
      'should reject "%s"',
      async (value) => {
        const errors = await validateValue(value);

        expect(errors).toHaveLength(1);
        expect(errors[0].constraints).toHaveProperty('isDecimalString');
      },
    );
  });

  describe('invalid format', () => {
    it.each([
      '',
      ' ',
      '.',
      '.1234',
      '-',
      '-.1234',
      '1,5',
      '1.2.3',
      'abc',
      '10abc',
      'abc10',
      '+10',
      '+10.1234',
      '1e3',
      'NaN',
      'Infinity',
    ])('should reject "%s"', async (value) => {
      const errors = await validateValue(value);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isDecimalString');
    });
  });

  describe('invalid types', () => {
    it.each([10, 10.5, 0, -10, null, undefined, true, false, {}, []])(
      'should reject non-string value %#',
      async (value) => {
        const errors = await validateValue(value);

        expect(errors).toHaveLength(1);
        expect(errors[0].constraints).toHaveProperty('isDecimalString');
      },
    );
  });

  describe('default message', () => {
    it('should return the default validation message', async () => {
      const errors = await validateValue('123456789012');

      expect(errors).toHaveLength(1);

      expect(errors[0].constraints?.isDecimalString).toBe(
        'value must be a valid decimal number with up to 11 integer digits and 4 decimal places',
      );
    });
  });

  describe('custom message', () => {
    it('should use custom validation message', async () => {
      const dto = new CustomMessageDto();

      dto.value = 'invalid';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);

      expect(errors[0].constraints?.isDecimalString).toBe('Invalid decimal');
    });
  });
});
