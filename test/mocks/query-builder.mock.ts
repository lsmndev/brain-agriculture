import { vi } from 'vitest';

export function makeQueryBuilderMock() {
  const queryBuilder = {
    select: vi.fn(),
    addSelect: vi.fn(),

    innerJoin: vi.fn(),
    innerJoinAndSelect: vi.fn(),
    leftJoin: vi.fn(),
    leftJoinAndSelect: vi.fn(),

    where: vi.fn(),
    andWhere: vi.fn(),
    orWhere: vi.fn(),

    groupBy: vi.fn(),
    addGroupBy: vi.fn(),

    orderBy: vi.fn(),
    addOrderBy: vi.fn(),

    limit: vi.fn(),
    offset: vi.fn(),

    setLock: vi.fn(),

    getOne: vi.fn(),
    getMany: vi.fn(),
    getRawOne: vi.fn(),
    getRawMany: vi.fn(),
  };

  queryBuilder.select.mockReturnValue(queryBuilder);
  queryBuilder.addSelect.mockReturnValue(queryBuilder);

  queryBuilder.innerJoin.mockReturnValue(queryBuilder);
  queryBuilder.innerJoinAndSelect.mockReturnValue(queryBuilder);
  queryBuilder.leftJoin.mockReturnValue(queryBuilder);
  queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder);

  queryBuilder.where.mockReturnValue(queryBuilder);
  queryBuilder.andWhere.mockReturnValue(queryBuilder);
  queryBuilder.orWhere.mockReturnValue(queryBuilder);

  queryBuilder.groupBy.mockReturnValue(queryBuilder);
  queryBuilder.addGroupBy.mockReturnValue(queryBuilder);

  queryBuilder.orderBy.mockReturnValue(queryBuilder);
  queryBuilder.addOrderBy.mockReturnValue(queryBuilder);

  queryBuilder.limit.mockReturnValue(queryBuilder);
  queryBuilder.offset.mockReturnValue(queryBuilder);

  queryBuilder.setLock.mockReturnValue(queryBuilder);

  return queryBuilder;
}

export type MockQueryBuilder = ReturnType<typeof makeQueryBuilderMock>;
