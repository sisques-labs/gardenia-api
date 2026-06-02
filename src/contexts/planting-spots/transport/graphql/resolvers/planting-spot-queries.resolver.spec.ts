import { QueryBus } from '@nestjs/cqrs';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { PlantingSpotGraphQLMapper } from '../mappers/planting-spot/planting-spot.mapper';
import { PlantingSpotResponseDto } from '../dtos/responses/planting-spot.response.dto';
import { PlantingSpotQueriesResolver } from './planting-spot-queries.resolver';

const SPOT_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const SPACE_ID = '33333333-3333-4333-8333-333333333333';
const now = new Date('2024-01-01T00:00:00Z');

const mockVm = new PlantingSpotViewModel({
  id: SPOT_ID,
  name: 'North Bed',
  type: PlantingSpotTypeEnum.RAISED_BED,
  description: null,
  userId: USER_ID,
  spaceId: SPACE_ID,
  createdAt: now,
  updatedAt: now,
});

const mockResponseDto: PlantingSpotResponseDto = {
  id: SPOT_ID,
  name: 'North Bed',
  type: PlantingSpotTypeEnum.RAISED_BED,
  description: null,
  userId: USER_ID,
  spaceId: SPACE_ID,
  createdAt: now,
  updatedAt: now,
};

describe('PlantingSpotQueriesResolver', () => {
  let resolver: PlantingSpotQueriesResolver;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<PlantingSpotGraphQLMapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponseDto: jest.fn(),
      toPaginatedResponseDto: jest.fn(),
    } as unknown as jest.Mocked<PlantingSpotGraphQLMapper>;

    resolver = new PlantingSpotQueriesResolver(queryBus, mapper);
  });

  describe('plantingSpot', () => {
    it('dispatches PlantingSpotFindByIdQuery and returns mapped response', async () => {
      queryBus.execute.mockResolvedValueOnce(mockVm);
      mapper.toResponseDto.mockReturnValueOnce(mockResponseDto);

      const result = await resolver.plantingSpot(SPOT_ID, SPACE_ID);

      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(result?.id).toBe(SPOT_ID);
    });

    it('returns null when query returns null', async () => {
      queryBus.execute.mockResolvedValueOnce(null);

      const result = await resolver.plantingSpot(SPOT_ID, SPACE_ID);

      expect(result).toBeNull();
      expect(mapper.toResponseDto).not.toHaveBeenCalled();
    });
  });

  describe('plantingSpots', () => {
    it('dispatches PlantingSpotFindByCriteriaQuery and returns paginated result', async () => {
      const paginatedVms = {
        items: [mockVm],
        total: 1,
        page: 1,
        perPage: 20,
        totalPages: 1,
      };
      const paginatedDto = {
        items: [mockResponseDto],
        total: 1,
        page: 1,
        perPage: 20,
        totalPages: 1,
      };

      queryBus.execute.mockResolvedValueOnce(paginatedVms);
      mapper.toPaginatedResponseDto.mockReturnValueOnce(paginatedDto);

      const result = await resolver.plantingSpots(SPACE_ID);

      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
