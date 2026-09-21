import { describe, expect, it } from 'vitest';

import { bigIntToDecimal, decimalToBigInt, normalizeDecimal } from './decimal.util.js';

describe('decimal.util', () => {
  describe('decimalToBigInt', () => {
    it('should convert an integer decimal string', () => {
      expect(decimalToBigInt('10')).toBe(100000n);
    });

    it('should convert a decimal with one decimal place', () => {
      expect(decimalToBigInt('10.1')).toBe(101000n);
    });

    it('should convert a decimal with two decimal places', () => {
      expect(decimalToBigInt('10.12')).toBe(101200n);
    });

    it('should convert a decimal with three decimal places', () => {
      expect(decimalToBigInt('10.123')).toBe(101230n);
    });

    it('should convert a decimal with four decimal places', () => {
      expect(decimalToBigInt('10.1234')).toBe(101234n);
    });

    it('should convert zero', () => {
      expect(decimalToBigInt('0')).toBe(0n);
      expect(decimalToBigInt('0.0000')).toBe(0n);
    });

    it('should convert the smallest supported positive decimal', () => {
      expect(decimalToBigInt('0.0001')).toBe(1n);
    });

    it('should convert a negative integer', () => {
      expect(decimalToBigInt('-10')).toBe(-100000n);
    });

    it('should convert a negative decimal', () => {
      expect(decimalToBigInt('-10.1234')).toBe(-101234n);
    });

    it('should reject more than four decimal places', () => {
      expect(() => decimalToBigInt('10.12345')).toThrow('Invalid decimal value: "10.12345"');
    });

    it.each(['', 'abc', '10.', '.1234', '1.2.3', '10,50', '--10', '+10', ' 10', '10 '])(
      'should reject invalid decimal value "%s"',
      (value) => {
        expect(() => decimalToBigInt(value)).toThrow(`Invalid decimal value: "${value}"`);
      },
    );
  });

  describe('bigIntToDecimal', () => {
    it('should convert a positive bigint to decimal', () => {
      expect(bigIntToDecimal(101234n)).toBe('10.1234');
    });

    it('should convert an integer bigint to decimal with four decimal places', () => {
      expect(bigIntToDecimal(100000n)).toBe('10.0000');
    });

    it('should convert zero', () => {
      expect(bigIntToDecimal(0n)).toBe('0.0000');
    });

    it('should preserve leading zeros in decimal places', () => {
      expect(bigIntToDecimal(100001n)).toBe('10.0001');
    });

    it('should convert the smallest supported positive value', () => {
      expect(bigIntToDecimal(1n)).toBe('0.0001');
    });

    it('should convert a negative bigint', () => {
      expect(bigIntToDecimal(-101234n)).toBe('-10.1234');
    });

    it('should convert the smallest supported negative value', () => {
      expect(bigIntToDecimal(-1n)).toBe('-0.0001');
    });
  });

  describe('normalizeDecimal', () => {
    it.each([
      ['10', '10.0000'],
      ['10.1', '10.1000'],
      ['10.12', '10.1200'],
      ['10.123', '10.1230'],
      ['10.1234', '10.1234'],
      ['0', '0.0000'],
      ['0.1', '0.1000'],
      ['0.0001', '0.0001'],
      ['-10', '-10.0000'],
      ['-10.1', '-10.1000'],
      ['-10.1234', '-10.1234'],
    ])('should normalize "%s" to "%s"', (input, expected) => {
      expect(normalizeDecimal(input)).toBe(expected);
    });

    it('should reject invalid decimal values', () => {
      expect(() => normalizeDecimal('10.12345')).toThrow('Invalid decimal value: "10.12345"');
    });
  });
});
