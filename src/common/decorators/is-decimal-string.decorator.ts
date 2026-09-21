import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

const DECIMAL_PRECISION = 15;
const DECIMAL_SCALE = 4;

const INTEGER_DIGITS = DECIMAL_PRECISION - DECIMAL_SCALE;

const DECIMAL_REGEX = new RegExp(`^-?\\d{1,${INTEGER_DIGITS}}(\\.\\d{1,${DECIMAL_SCALE}})?$`);

export function IsDecimalString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isDecimalString',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && DECIMAL_REGEX.test(value);
        },

        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid decimal number with up to ${INTEGER_DIGITS} integer digits and ${DECIMAL_SCALE} decimal places`;
        },
      },
    });
  };
}
