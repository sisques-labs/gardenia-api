import { QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationFindByCriteriaQuery } from '@contexts/plant-identification/application/queries/plant-identification-find-by-criteria/plant-identification-find-by-criteria.query';
import { PlantIdentificationFindByIdQuery } from '@contexts/plant-identification/application/queries/plant-identification-find-by-id/plant-identification-find-by-id.query';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';
import { PlantIdentificationGraphQLMapper } from '@contexts/plant-identification/transport/graphql/mappers/plant-identification/plant-identification.mapper';
import { PlantIdentificationQueriesResolver } from './plant-identification-queries.resolver';

const ID = '550e8400-e29b-41d4-a716-446655440000';

function buildViewModel(): PlantIdentificationViewModel {
  return new PlantIdentificationViewModel({
    id: ID,
    requestedByUserId: '660e8400-e29b-41d4-a716-446655440001',
    spaceId: '770e8400-e29b-41d4-a716-446655440002',
    status: PlantIdentificationStatusEnum.RESOLVED,
    resolvedSpeciesKey: 2882337,
    resolvedScientificName: 'Monstera deliciosa',
    resolvedSpeciesProvider: 'gbif',
    convertedToPlantId: null,
    photos: [],
    candidates: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('PlantIdentificationQueriesResolver', () => {
  let resolver: PlantIdentificationQueriesResolver;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<PlantIdentificationGraphQLMapper>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponseDto: jest.fn(),
      toPaginatedResponseDto: jest.fn(),
    } as unknown as jest.Mocked<PlantIdentificationGraphQLMapper>;
    resolver = new PlantIdentificationQueriesResolver(queryBus, mapper);
  });

  describe('plantIdentificationFindById()', () => {
    it('dispatches PlantIdentificationFindByIdQuery and maps the result', async () => {
      const vm = buildViewModel();
      queryBus.execute.mockResolvedValue(vm);
      mapper.toResponseDto.mockReturnValue({ id: ID } as never);

      const result = await resolver.plantIdentificationFindById({ id: ID });

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PlantIdentificationFindByIdQuery),
      );
      expect(mapper.toResponseDto).toHaveBeenCalledWith(vm);
      expect(result).toEqual({ id: ID });
    });

    it('returns null when not found', async () => {
      queryBus.execute.mockResolvedValue(null);

      const result = await resolver.plantIdentificationFindById({ id: ID });

      expect(result).toBeNull();
      expect(mapper.toResponseDto).not.toHaveBeenCalled();
    });
  });

  describe('plantIdentificationsFindByCriteria()', () => {
    it('dispatches PlantIdentificationFindByCriteriaQuery and maps the paginated result', async () => {
      const paginated = new PaginatedResult([buildViewModel()], 1, 1, 20);
      queryBus.execute.mockResolvedValue(paginated);
      mapper.toPaginatedResponseDto.mockReturnValue({
        items: [{ id: ID }],
        total: 1,
      } as never);

      const result =
        await resolver.plantIdentificationsFindByCriteria(undefined);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PlantIdentificationFindByCriteriaQuery),
      );
      expect(mapper.toPaginatedResponseDto).toHaveBeenCalledWith(paginated);
      expect(result).toEqual({ items: [{ id: ID }], total: 1 });
    });
  });
});
