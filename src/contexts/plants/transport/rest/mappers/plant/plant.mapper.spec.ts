import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { PlantRestMapper } from './plant.mapper';

const PLANT_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
const USER_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901';
const SPACE_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';
const SPECIES_ID = '550e8400-e29b-41d4-a716-446655440003';
const QR_ID = 'd4e5f6a7-b8c9-4123-def0-234567890123';
const NOW = new Date('2024-01-01T00:00:00Z');

describe('PlantRestMapper', () => {
  let mapper: PlantRestMapper;

  beforeEach(() => {
    mapper = new PlantRestMapper();
  });

  it('maps scalar fields from a full PlantViewModel', () => {
    const vm = new PlantViewModel({
      id: PLANT_ID,
      name: 'Rose',
      plantSpeciesId: SPECIES_ID,
      imageUrl: 'https://example.com/rose.jpg',
      userId: USER_ID,
      spaceId: SPACE_ID,
      qrId: QR_ID,
      plantingSpotId: null,
      createdAt: NOW,
      updatedAt: NOW,
    });

    const dto = mapper.toResponse(vm);

    expect(dto.id).toBe(PLANT_ID);
    expect(dto.name).toBe('Rose');
    expect(dto.plantSpeciesId).toBe(SPECIES_ID);
    expect(dto.imageUrl).toBe('https://example.com/rose.jpg');
    expect(dto.userId).toBe(USER_ID);
    expect(dto.spaceId).toBe(SPACE_ID);
    expect(dto.qrId).toBe(QR_ID);
    expect(dto.createdAt).toBe(NOW);
    expect(dto.updatedAt).toBe(NOW);
  });

  it('maps nullable fields as null when absent', () => {
    const vm = new PlantViewModel({
      id: PLANT_ID,
      name: 'Cactus',
      plantSpeciesId: null,
      imageUrl: null,
      userId: USER_ID,
      spaceId: SPACE_ID,
      qrId: null,
      plantingSpotId: null,
      createdAt: NOW,
      updatedAt: NOW,
    });

    const dto = mapper.toResponse(vm);

    expect(dto.plantSpeciesId).toBeNull();
    expect(dto.imageUrl).toBeNull();
    expect(dto.qrId).toBeNull();
  });
});
