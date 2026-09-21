import { QueryFailedError } from 'typeorm';

function makeQueryFailedError(code: string, message: string): QueryFailedError {
  return new QueryFailedError(
    'QUERY',
    [],
    Object.assign(new Error(message), {
      code,
    }),
  );
}

export function makeUniqueViolationError(): QueryFailedError {
  return makeQueryFailedError('23505', 'unique constraint violation');
}

export function makeForeignKeyViolationError(): QueryFailedError {
  return makeQueryFailedError('23503', 'foreign key constraint violation');
}
