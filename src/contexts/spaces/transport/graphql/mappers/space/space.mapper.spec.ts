import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';
import { SpaceGraphQLMapper } from './space.mapper';

const SPACE_ID = 'a1b2c3d4-e5f6-4890-8bcd-ef1234567890';
const OWNER_ID = 'b2c3d4e5-f6a7-4901-8cde-f12345678901';

describe('SpaceGraphQLMapper', () => {
  let mapper: SpaceGraphQLMapper;
  const now = new Date('2024-01-01T00:00:00Z');

  beforeEach(() => {
    mapper = new SpaceGraphQLMapper();
  });

  describe('toResponseDtoFromViewModel', () => {
    it('maps all 5 fields from a full SpaceViewModel', () => {
      const vm = new SpaceViewModel({
        id: SPACE_ID,
        name: 'My Garden',
        ownerId: OWNER_ID,
        createdAt: now,
        updatedAt: now,
        latitude: null,
        longitude: null,
        environment: null,
      });

      const dto = mapper.toResponseDtoFromViewModel(vm);

      expect(dto.id).toBe(SPACE_ID);
      expect(dto.name).toBe('My Garden');
      expect(dto.ownerId).toBe(OWNER_ID);
      expect(dto.createdAt).toBe(now);
      expect(dto.updatedAt).toBe(now);
    });

    it('passes updatedAt through as-is', () => {
      const updatedAt = new Date('2024-06-01T00:00:00Z');
      const vm = new SpaceViewModel({
        id: SPACE_ID,
        name: 'My Garden',
        ownerId: OWNER_ID,
        createdAt: now,
        updatedAt,
        latitude: null,
        longitude: null,
        environment: null,
      });

      const dto = mapper.toResponseDtoFromViewModel(vm);

      expect(dto.updatedAt).toBe(updatedAt);
    });
  });

  describe('toPaginatedResponseDto', () => {
    it('maps paginated result with items', () => {
      const vm = new SpaceViewModel({
        id: SPACE_ID,
        name: 'My Garden',
        ownerId: OWNER_ID,
        createdAt: now,
        updatedAt: now,
        latitude: null,
        longitude: null,
        environment: null,
      });
      const paginated = new PaginatedResult([vm], 1, 1, 10);

      const dto = mapper.toPaginatedResponseDto(paginated);

      expect(dto.items).toHaveLength(1);
      expect(dto.items[0].id).toBe(SPACE_ID);
      expect(dto.items[0].ownerId).toBe(OWNER_ID);
      expect(dto.total).toBe(1);
      expect(dto.page).toBe(1);
      expect(dto.perPage).toBe(10);
    });

    it('maps empty paginated result', () => {
      const paginated = new PaginatedResult([], 0, 1, 10);

      const dto = mapper.toPaginatedResponseDto(paginated);

      expect(dto.items).toHaveLength(0);
      expect(dto.total).toBe(0);
    });
  });
});
