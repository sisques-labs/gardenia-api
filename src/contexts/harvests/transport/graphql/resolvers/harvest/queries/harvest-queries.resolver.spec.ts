import { QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { HarvestFindByCriteriaQuery } from '@contexts/harvests/application/queries/harvest-find-by-criteria/harvest-find-by-criteria.query';
import { HarvestFindByIdQuery } from '@contexts/harvests/application/queries/harvest-find-by-id/harvest-find-by-id.query';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
import { HarvestGraphQLMapper } from '@contexts/harvests/transport/graphql/mappers/harvest/harvest.mapper';
import { HarvestQueriesResolver } from './harvest-queries.resolver';

const HARVEST_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('HarvestQueriesResolver', () => {
  let sut: HarvestQueriesResolver;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<HarvestGraphQLMapper>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponseDto: jest.fn().mockReturnValue({ id: HARVEST_ID }),
      toPaginatedResponseDto: jest.fn().mockReturnValue({ items: [] }),
    } as unknown as jest.Mocked<HarvestGraphQLMapper>;
    sut = new HarvestQueriesResolver(queryBus, mapper);
  });

  describe('harvestsFindByCriteria()', () => {
    it('dispatches the criteria query and maps the paginated result', async () => {
      const paginated = new PaginatedResult<HarvestViewModel>([], 0, 1, 10);
      queryBus.execute.mockResolvedValue(paginated);

      await sut.harvestsFindByCriteria(undefined);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(HarvestFindByCriteriaQuery),
      );
      expect(mapper.toPaginatedResponseDto).toHaveBeenCalledWith(paginated);
    });
  });

  describe('harvestFindById()', () => {
    it('maps the result when found', async () => {
      const vm = {} as HarvestViewModel;
      queryBus.execute.mockResolvedValue(vm);

      const result = await sut.harvestFindById({ id: HARVEST_ID } as never);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(HarvestFindByIdQuery),
      );
      expect(mapper.toResponseDto).toHaveBeenCalledWith(vm);
      expect(result).toEqual({ id: HARVEST_ID });
    });

    it('returns null when not found', async () => {
      queryBus.execute.mockResolvedValue(null);

      const result = await sut.harvestFindById({ id: HARVEST_ID } as never);

      expect(result).toBeNull();
      expect(mapper.toResponseDto).not.toHaveBeenCalled();
    });
  });
});
