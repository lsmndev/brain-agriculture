import { QueryFailedError } from 'typeorm';

export const POSTGRES_ERROR = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
} as const;

export function getDatabaseErrorCode(error: unknown): string | undefined {
  if (!(error instanceof QueryFailedError)) {
    return undefined;
  }

  return (error.driverError as { code?: string })?.code;
}
