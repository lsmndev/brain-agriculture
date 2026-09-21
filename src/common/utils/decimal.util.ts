const DECIMAL_SCALE = 4;
const DECIMAL_FACTOR = 10n ** BigInt(DECIMAL_SCALE);
const DECIMAL_REGEX = /^-?\d+(\.\d{1,4})?$/;

export function decimalToBigInt(value: string): bigint {
  if (!DECIMAL_REGEX.test(value)) {
    throw new Error(`Invalid decimal value: "${value}"`);
  }

  const negative = value.startsWith('-');
  const unsignedValue = negative ? value.slice(1) : value;
  const [integerPart, decimalPart = ''] = unsignedValue.split('.');
  const normalizedDecimal = decimalPart.padEnd(DECIMAL_SCALE, '0');
  const result = BigInt(integerPart) * DECIMAL_FACTOR + BigInt(normalizedDecimal);

  return negative ? -result : result;
}

export function bigIntToDecimal(value: bigint): string {
  const negative = value < 0n;
  const absoluteValue = negative ? -value : value;
  const integerPart = absoluteValue / DECIMAL_FACTOR;
  const decimalPart = absoluteValue % DECIMAL_FACTOR;
  const result = `${integerPart}.${decimalPart.toString().padStart(DECIMAL_SCALE, '0')}`;

  return negative ? `-${result}` : result;
}

export function normalizeDecimal(value: string): string {
  return bigIntToDecimal(decimalToBigInt(value));
}
