import { QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { PlantFindByIdRequestDto } from '../../dtos/requests/plant/plant-find-by-id.request.dto';
import { PlantGraphQLMapper } from '../../mappers/plant/plant.mapper';
import { PlantQueriesResolver } from './plant-queries.resolver';

const PLANT_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
const USER_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901';
const SPACE_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';

describe('PlantQueriesResolver', () => {
  let resolver: PlantQueriesResolver;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<PlantGraphQLMapper>;

  const now = new Date('2024-01-01T00:00:00Z');
  const mockVm = new PlantViewModel({
    id: PLANT_ID,
    name: 'Rose',
    species: null,
    imageUrl: null,
    userId: USER_ID,
    spaceId: SPACE_ID,
    qrId: null,
    createdAt: now,
    updatedAt: now,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponseDtoFromViewModel: jest.fn(),
      toPaginatedResponseDto: jest.fn(),
    } as unknown as jest.Mocked<PlantGraphQLMapper>;

    resolver = new PlantQueriesResolver(queryBus, mapper);
  });

  it('plantFindById dispatches query and returns mapped response', async () => {
    queryBus.execute.mockResolvedValueOnce(mockVm);
    mapper.toResponseDtoFromViewModel.mockReturnValueOnce({
      id: PLANT_ID,
      name: 'Rose',
      species: null,
      imageUrl: null,
      userId: USER_ID,
      spaceId: SPACE_ID,
      createdAt: now,
      updatedAt: now,
    });

    const input: PlantFindByIdRequestDto = { id: PLANT_ID };
    const result = await resolver.plantFindById(input);

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    expect(result?.id).toBe(PLANT_ID);
    expect(result?.name).toBe('Rose');
  });

  it('plantsFindByCriteria dispatches query and returns paginated response', async () => {
    const paginated = new PaginatedResult([mockVm], 1, 1, 10);
    queryBus.execute.mockResolvedValueOnce(paginated);
    mapper.toPaginatedResponseDto.mockReturnValueOnce({
      items: [
        {
          id: PLANT_ID,
          name: 'Rose',
          species: null,
          imageUrl: null,
          userId: USER_ID,
          spaceId: SPACE_ID,
          qrId: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
      total: 1,
      page: 1,
      perPage: 10,
      totalPages: 1,
    });

    const result = await resolver.plantsFindByCriteria();

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});
