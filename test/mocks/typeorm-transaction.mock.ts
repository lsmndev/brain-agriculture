import type { EntityManager } from 'typeorm';
import { vi } from 'vitest';

type RepositoryEntry = readonly [entity: unknown, repository: unknown];

export type MockTransaction = {
  manager: EntityManager;
  getRepository: ReturnType<typeof vi.fn>;
  dataSource: {
    transaction: ReturnType<typeof vi.fn>;
  };
};

export function makeTransactionMock(entries: RepositoryEntry[]): MockTransaction {
  const repositories = new Map<unknown, unknown>(entries);

  const getRepository = vi.fn((entity: unknown) => {
    const repository = repositories.get(entity);

    if (!repository) {
      throw new Error(`Unexpected repository: ${String(entity)}`);
    }

    return repository;
  });

  const manager = {
    getRepository,
  } as unknown as EntityManager;

  return {
    manager,
    getRepository,
    dataSource: {
      transaction: vi.fn(async (callback: (manager: EntityManager) => Promise<unknown>) => callback(manager)),
    },
  };
}
