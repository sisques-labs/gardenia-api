import { QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { CareLogFindByCriteriaQuery } from '@contexts/care-log/application/queries/care-log-find-by-criteria/care-log-find-by-criteria.query';
import { AssertCareLogEntryViewModelExistsService } from '@contexts/care-log/application/services/read/assert-care-log-entry-view-model-exists/assert-care-log-entry-view-model-exists.service';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
import { CareLogGraphQLMapper } from '../mappers/care-log/care-log.mapper';
import { CareLogQueriesResolver } from './care-log-queries.resolver';

const ENTRY_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('CareLogQueriesResolver', () => {
  let sut: CareLogQueriesResolver;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<CareLogGraphQLMapper>;
  let assertExists: jest.Mocked<AssertCareLogEntryViewModelExistsService>;
  const dto = { id: ENTRY_ID } as never;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponseDto: jest.fn().mockReturnValue(dto),
    } as unknown as jest.Mocked<CareLogGraphQLMapper>;
    assertExists = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertCareLogEntryViewModelExistsService>;
    sut = new CareLogQueriesResolver(queryBus, mapper, assertExists);
  });

  describe('careLogFindById()', () => {
    it('asserts the entry exists and maps it', async () => {
      const vm = {} as CareLogEntryViewModel;
      assertExists.execute.mockResolvedValue(vm);

      const result = await sut.careLogFindById(ENTRY_ID);

      expect(assertExists.execute).toHaveBeenCalledWith(ENTRY_ID);
      expect(mapper.toResponseDto).toHaveBeenCalledWith(vm);
      expect(result).toBe(dto);
    });
  });

  describe('careLogFindByCriteria()', () => {
    it('dispatches the criteria query and maps each item', async () => {
      const vm = {} as CareLogEntryViewModel;
      queryBus.execute.mockResolvedValue(new PaginatedResult([vm], 1, 1, 10));

      const result = await sut.careLogFindByCriteria(undefined);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(CareLogFindByCriteriaQuery),
      );
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.perPage).toBe(10);
    });
  });
});
