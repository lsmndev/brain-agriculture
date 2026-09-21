import type { DeepPartial } from 'typeorm';
import { vi } from 'vitest';

export type MockRepository = {
  find: ReturnType<typeof vi.fn>;
  findOne: ReturnType<typeof vi.fn>;
  findOneBy: ReturnType<typeof vi.fn>;

  create: ReturnType<typeof vi.fn>;
  merge: ReturnType<typeof vi.fn>;

  save: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;

  count: ReturnType<typeof vi.fn>;
  exist: ReturnType<typeof vi.fn>;

  createQueryBuilder: ReturnType<typeof vi.fn>;
};

export function makeRepositoryMock<T extends object>(): MockRepository {
  return {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneBy: vi.fn(),

    create: vi.fn((entity: DeepPartial<T>) => entity as T),

    merge: vi.fn((entity: T, ...entityLikes: DeepPartial<T>[]) => {
      Object.assign(entity, ...entityLikes);

      return entity;
    }),

    save: vi.fn(),
    remove: vi.fn(),
    delete: vi.fn(),

    count: vi.fn(),
    exist: vi.fn(),

    createQueryBuilder: vi.fn(),
  };
}
