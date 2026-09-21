import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { isCPF, isCNPJ } from 'validation-br';

import { DocumentType } from '@common/enums/document-type.enum.js';

export function IsCPForCNPJ(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCPForCNPJ',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (typeof value !== 'string') {
            return false;
          }

          const documentType = (
            args.object as {
              documentType?: DocumentType;
            }
          ).documentType;

          if (!documentType) {
            return true;
          }

          if (documentType === DocumentType.CPF) {
            return isCPF(value);
          }

          if (documentType === DocumentType.CNPJ) {
            return isCNPJ(value);
          }

          return false;
        },

        defaultMessage(args: ValidationArguments): string {
          const documentType = (
            args.object as {
              documentType?: string;
            }
          ).documentType;

          return `${documentType ?? 'CPF/CNPJ'} inválido.`;
        },
      },
    });
  };
}
