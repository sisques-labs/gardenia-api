import { PlantingSpotFindByCriteriaQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-criteria/planting-spot-find-by-criteria.query';
import { PlantingSpotFindByIdQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-id/planting-spot-find-by-id.query';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { PlantingSpotFindByIdRequestDto } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-find-by-id.request.dto';
import { PlantingSpotGraphQLMapper } from '@contexts/planting-spots/transport/graphql/mappers/planting-spot/planting-spot.mapper';
import { QueryBus } from '@nestjs/cqrs';

import { PlantingSpotQueriesResolver } from './planting-spot-queries.resolver';

const SPOT_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const SPACE_ID = '33333333-3333-4333-8333-333333333333';

describe('PlantingSpotQueriesResolver', () => {
  let sut: PlantingSpotQueriesResolver;
  let queryBus: jest.Mocked<QueryBus>;
  let plantingSpotGraphQLMapper: jest.Mocked<PlantingSpotGraphQLMapper>;

  const now = new Date('2024-01-01T00:00:00Z');
  const mockViewModel = new PlantingSpotViewModel({
    id: SPOT_ID,
    name: 'North Bed',
    type: PlantingSpotTypeEnum.RAISED_BED,
    description: null,
    userId: USER_ID,
    spaceId: SPACE_ID,
    createdAt: now,
    updatedAt: now,
  });

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    plantingSpotGraphQLMapper = {
      toResponseDtoFromViewModel: jest.fn(),
      toPaginatedResponseDto: jest.fn(),
    } as unknown as jest.Mocked<PlantingSpotGraphQLMapper>;
    sut = new PlantingSpotQueriesResolver(queryBus, plantingSpotGraphQLMapper);
  });

  describe('plantingSpotFindById()', () => {
    it('should execute PlantingSpotFindByIdQuery with the given id', async () => {
      queryBus.execute.mockResolvedValue(null);

      await sut.plantingSpotFindById({ id: SPOT_ID });

      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PlantingSpotFindByIdQuery),
      );
    });

    it('should return mapped DTO when planting spot is found', async () => {
      const mockDto = { id: SPOT_ID, name: 'North Bed' } as any;
      queryBus.execute.mockResolvedValue(mockViewModel);
      plantingSpotGraphQLMapper.toResponseDtoFromViewModel.mockReturnValue(
        mockDto,
      );

      const input: PlantingSpotFindByIdRequestDto = { id: SPOT_ID };
      const result = await sut.plantingSpotFindById(input);

      expect(
        plantingSpotGraphQLMapper.toResponseDtoFromViewModel,
      ).toHaveBeenCalledWith(mockViewModel);
      expect(result).toBe(mockDto);
    });

    it('should return null when planting spot is not found', async () => {
      queryBus.execute.mockResolvedValue(null);

      const result = await sut.plantingSpotFindById({ id: SPOT_ID });

      expect(result).toBeNull();
      expect(
        plantingSpotGraphQLMapper.toResponseDtoFromViewModel,
      ).not.toHaveBeenCalled();
    });
  });

  describe('plantingSpotsFindByCriteria()', () => {
    it('should execute PlantingSpotFindByCriteriaQuery', async () => {
      const mockPaginatedResult = {
        items: [],
        total: 0,
        page: 1,
        perPage: 10,
        totalPages: 0,
      };
      const mockDto = { items: [], total: 0 } as any;
      queryBus.execute.mockResolvedValue(mockPaginatedResult);
      plantingSpotGraphQLMapper.toPaginatedResponseDto.mockReturnValue(mockDto);

      await sut.plantingSpotsFindByCriteria(undefined);

      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PlantingSpotFindByCriteriaQuery),
      );
    });

    it('should return mapped paginated DTO', async () => {
      const mockPaginatedResult = {
        items: [mockViewModel],
        total: 1,
        page: 1,
        perPage: 10,
        totalPages: 1,
      };
      const mockDto = { items: [{ id: SPOT_ID }], total: 1 } as any;
      queryBus.execute.mockResolvedValue(mockPaginatedResult);
      plantingSpotGraphQLMapper.toPaginatedResponseDto.mockReturnValue(mockDto);

      const result = await sut.plantingSpotsFindByCriteria(undefined);

      expect(
        plantingSpotGraphQLMapper.toPaginatedResponseDto,
      ).toHaveBeenCalledWith(mockPaginatedResult);
      expect(result).toBe(mockDto);
    });
  });
});
