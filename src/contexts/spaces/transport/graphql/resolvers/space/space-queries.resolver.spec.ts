import { QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';

import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';
import { SKIP_SPACE_KEY } from '../../../../../../shared/decorators/skip-space.decorator';
import { SpaceFindByIdRequestDto } from '../../dtos/requests/space/space-find-by-id.request.dto';
import { SpaceGraphQLMapper } from '../../mappers/space/space.mapper';
import { SpaceQueriesResolver } from './space-queries.resolver';

const SPACE_ID = 'a1b2c3d4-e5f6-4890-8bcd-ef1234567890';
const OWNER_ID = 'b2c3d4e5-f6a7-4901-8cde-f12345678901';
const USER_ID = 'd4e5f6a7-b8c9-4123-8efa-234567890123';

describe('SpaceQueriesResolver', () => {
  let resolver: SpaceQueriesResolver;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<SpaceGraphQLMapper>;

  const now = new Date('2024-01-01T00:00:00Z');
  const mockVm = new SpaceViewModel({
    id: SPACE_ID,
    name: 'My Garden',
    ownerId: OWNER_ID,
    createdAt: now,
    updatedAt: now,
    latitude: null,
    longitude: null,
    environment: null,
  });

  const mockUser = { userId: USER_ID, email: 'user@test.com', sub: USER_ID };

  beforeEach(() => {
    jest.clearAllMocks();

    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponseDtoFromViewModel: jest.fn(),
      toPaginatedResponseDto: jest.fn(),
    } as unknown as jest.Mocked<SpaceGraphQLMapper>;

    resolver = new SpaceQueriesResolver(queryBus, mapper);
  });

  describe('spaceFindById', () => {
    it('dispatches SpaceFindByIdQuery and returns mapped response', async () => {
      queryBus.execute.mockResolvedValueOnce(mockVm);
      mapper.toResponseDtoFromViewModel.mockReturnValueOnce({
        id: SPACE_ID,
        name: 'My Garden',
        ownerId: OWNER_ID,
        createdAt: now,
        updatedAt: now,
      });

      const input: SpaceFindByIdRequestDto = { id: SPACE_ID };
      const result = await resolver.spaceFindById(input, mockUser as any);

      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(result?.id).toBe(SPACE_ID);
      expect(result?.ownerId).toBe(OWNER_ID);
    });

    it('returns null when space not found', async () => {
      queryBus.execute.mockResolvedValueOnce(null);

      const input: SpaceFindByIdRequestDto = { id: SPACE_ID };
      const result = await resolver.spaceFindById(input, mockUser as any);

      expect(result).toBeNull();
      expect(mapper.toResponseDtoFromViewModel).not.toHaveBeenCalled();
    });
  });

  describe('spacesFindByUser', () => {
    it('dispatches SpacesFindByUserQuery with userId from CurrentUser', async () => {
      const paginated = new PaginatedResult([mockVm], 1, 1, 10);
      queryBus.execute.mockResolvedValueOnce(paginated);
      mapper.toPaginatedResponseDto.mockReturnValueOnce({
        items: [
          {
            id: SPACE_ID,
            name: 'My Garden',
            ownerId: OWNER_ID,
            createdAt: now,
            updatedAt: now,
          },
        ],
        total: 1,
        page: 1,
        perPage: 10,
        totalPages: 1,
      });

      const result = await resolver.spacesFindByUser(mockUser as any);

      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('has @SkipSpace metadata on spacesFindByUser', () => {
      const method = SpaceQueriesResolver.prototype.spacesFindByUser;
      const metadata = Reflect.getMetadata(SKIP_SPACE_KEY, method);
      expect(metadata).toBe(true);
    });
  });

  describe('guards', () => {
    it('spaceFindById has JwtAuthGuard', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        SpaceQueriesResolver.prototype.spaceFindById,
      );
      expect(guards).toContain(JwtAuthGuard);
    });

    it('spacesFindByUser has JwtAuthGuard', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        SpaceQueriesResolver.prototype.spacesFindByUser,
      );
      expect(guards).toContain(JwtAuthGuard);
    });
  });
});
