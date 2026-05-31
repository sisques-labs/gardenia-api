import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';
import { PlantGraphQLMapper } from './plant.mapper';

const PLANT_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
const USER_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901';
const SPACE_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';

describe('PlantGraphQLMapper', () => {
  let mapper: PlantGraphQLMapper;
  const now = new Date('2024-01-01T00:00:00Z');

  beforeEach(() => {
    mapper = new PlantGraphQLMapper();
  });

  describe('toResponseDtoFromViewModel', () => {
    it('maps all 8 fields from a full PlantViewModel', () => {
      const vm = new PlantViewModel({
        id: PLANT_ID,
        name: 'Rose',
        species: 'Rosa canina',
        imageUrl: 'https://example.com/rose.jpg',
        userId: USER_ID,
        spaceId: SPACE_ID,
        qrId: null,
        createdAt: now,
        updatedAt: now,
      });

      const dto = mapper.toResponseDtoFromViewModel(vm);

      expect(dto.id).toBe(PLANT_ID);
      expect(dto.name).toBe('Rose');
      expect(dto.species).toBe('Rosa canina');
      expect(dto.imageUrl).toBe('https://example.com/rose.jpg');
      expect(dto.userId).toBe(USER_ID);
      expect(dto.spaceId).toBe(SPACE_ID);
      expect(dto.createdAt).toBe(now);
      expect(dto.updatedAt).toBe(now);
    });

    it('maps nullable species and imageUrl', () => {
      const vm = new PlantViewModel({
        id: PLANT_ID,
        name: 'Cactus',
        species: null,
        imageUrl: null,
        userId: USER_ID,
        spaceId: SPACE_ID,
        qrId: null,
        createdAt: now,
        updatedAt: now,
      });

      const dto = mapper.toResponseDtoFromViewModel(vm);

      expect(dto.name).toBe('Cactus');
      expect(dto.species).toBeNull();
      expect(dto.imageUrl).toBeNull();
    });
  });

  describe('toPaginatedResponseDto', () => {
    it('maps paginated result with items', () => {
      const vm = new PlantViewModel({
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
      const paginated = new PaginatedResult([vm], 1, 1, 10);

      const dto = mapper.toPaginatedResponseDto(paginated);

      expect(dto.items).toHaveLength(1);
      expect(dto.items[0].id).toBe(PLANT_ID);
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
