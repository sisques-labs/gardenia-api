import { QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesFindByCriteriaQuery } from '@contexts/plant-species/application/queries/plant-species-find-by-criteria/plant-species-find-by-criteria.query';
import { PlantSpeciesFindByIdQuery } from '@contexts/plant-species/application/queries/plant-species-find-by-id/plant-species-find-by-id.query';
import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';
import { PlantSpeciesGraphQLMapper } from '@contexts/plant-species/transport/graphql/mappers/plant-species.mapper';
import { PlantSpeciesQueriesResolver } from './plant-species-queries.resolver';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('PlantSpeciesQueriesResolver', () => {
  let sut: PlantSpeciesQueriesResolver;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<PlantSpeciesGraphQLMapper>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponseDtoFromViewModel: jest.fn().mockReturnValue({ id: ID }),
      toPaginatedResponseDto: jest.fn().mockReturnValue({ items: [] }),
    } as unknown as jest.Mocked<PlantSpeciesGraphQLMapper>;
    sut = new PlantSpeciesQueriesResolver(queryBus, mapper);
  });

  describe('plantSpeciesFindById()', () => {
    it('dispatches the query and maps the result', async () => {
      const vm = {} as PlantSpeciesViewModel;
      queryBus.execute.mockResolvedValue(vm);

      const result = await sut.plantSpeciesFindById({ id: ID } as never);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PlantSpeciesFindByIdQuery),
      );
      expect(mapper.toResponseDtoFromViewModel).toHaveBeenCalledWith(vm);
      expect(result).toEqual({ id: ID });
    });
  });

  describe('plantSpeciesFindByCriteria()', () => {
    it('dispatches the criteria query and maps the paginated result', async () => {
      const paginated = new PaginatedResult<PlantSpeciesViewModel>(
        [],
        0,
        1,
        10,
      );
      queryBus.execute.mockResolvedValue(paginated);

      await sut.plantSpeciesFindByCriteria(undefined);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PlantSpeciesFindByCriteriaQuery),
      );
      expect(mapper.toPaginatedResponseDto).toHaveBeenCalledWith(paginated);
    });
  });
});
