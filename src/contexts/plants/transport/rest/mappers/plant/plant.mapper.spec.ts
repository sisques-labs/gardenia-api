import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { PlantRestMapper } from './plant.mapper';

const PLANT_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
const USER_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901';
const SPACE_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';
const PLANT_ID_2 = 'd4e5f6a7-b8c9-4123-def0-234567890123';
const USER_ID_2 = 'e5f6a7b8-c9d0-4234-ef01-345678901234';
const SPACE_ID_2 = 'f6a7b8c9-d0e1-4345-f012-456789012345';

describe('PlantRestMapper', () => {
  let mapper: PlantRestMapper;

  beforeEach(() => {
    mapper = new PlantRestMapper();
  });

  it('maps all 8 fields from a full PlantViewModel', () => {
    const now = new Date('2024-01-01T00:00:00Z');
    const vm = new PlantViewModel({
      id: PLANT_ID,
      name: 'Rose',
      species: 'Rosa canina',
      imageUrl: 'https://example.com/rose.jpg',
      userId: USER_ID,
      spaceId: SPACE_ID,
      createdAt: now,
      updatedAt: now,
    });

    const dto = mapper.toResponse(vm);

    expect(dto.id).toBe(PLANT_ID);
    expect(dto.name).toBe('Rose');
    expect(dto.species).toBe('Rosa canina');
    expect(dto.imageUrl).toBe('https://example.com/rose.jpg');
    expect(dto.userId).toBe(USER_ID);
    expect(dto.spaceId).toBe(SPACE_ID);
    expect(dto.createdAt).toBe(now);
    expect(dto.updatedAt).toBe(now);
  });

  it('maps nullable species and imageUrl as null', () => {
    const now = new Date('2024-01-01T00:00:00Z');
    const vm = new PlantViewModel({
      id: PLANT_ID_2,
      name: 'Cactus',
      species: null,
      imageUrl: null,
      userId: USER_ID_2,
      spaceId: SPACE_ID_2,
      createdAt: now,
      updatedAt: now,
    });

    const dto = mapper.toResponse(vm);

    expect(dto.name).toBe('Cactus');
    expect(dto.species).toBeNull();
    expect(dto.imageUrl).toBeNull();
  });
});
