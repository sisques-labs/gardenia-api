import { PlantQrViewModel } from '@contexts/plants/domain/view-models/plant-qr.view-model';
import { PlantSpeciesViewModel } from '@contexts/plants/domain/view-models/plant-species.view-model';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { PlantRestMapper } from './plant.mapper';

const PLANT_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
const USER_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901';
const SPACE_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';
const SPECIES_ID = '550e8400-e29b-41d4-a716-446655440003';
const QR_ID = 'd4e5f6a7-b8c9-4123-def0-234567890123';
const PLANT_ID_2 = 'f6a7b8c9-d0e1-4345-f012-456789012345';
const USER_ID_2 = 'a7b8c9d0-e1f2-4456-0123-567890123456';
const SPACE_ID_2 = 'b8c9d0e1-f2a3-4567-1234-678901234567';
const NOW = new Date('2024-01-01T00:00:00Z');

function makeQrData(): PlantQrViewModel {
  return new PlantQrViewModel({
    id: QR_ID,
    spaceId: SPACE_ID,
    targetUrl: 'https://gardenia.app/qr/d4e5f6a7',
    generation: 1,
    image: 'aGVsbG93b3JsZA==',
    createdAt: NOW,
    updatedAt: NOW,
  });
}

function makeSpeciesData(): PlantSpeciesViewModel {
  return new PlantSpeciesViewModel({
    id: SPECIES_ID,
    name: 'Rosa canina',
    createdAt: NOW,
    updatedAt: NOW,
  });
}

describe('PlantRestMapper', () => {
  let mapper: PlantRestMapper;

  beforeEach(() => {
    mapper = new PlantRestMapper();
  });

  it('maps all fields from a full PlantViewModel', () => {
    const vm = new PlantViewModel({
      id: PLANT_ID,
      name: 'Rose',
      plantSpeciesId: SPECIES_ID,
      species: makeSpeciesData(),
      imageUrl: 'https://example.com/rose.jpg',
      userId: USER_ID,
      spaceId: SPACE_ID,
      qrId: null,
      plantingSpotId: null,
      createdAt: NOW,
      updatedAt: NOW,
    });

    const dto = mapper.toResponse(vm);

    expect(dto.id).toBe(PLANT_ID);
    expect(dto.name).toBe('Rose');
    expect(dto.plantSpeciesId).toBe(SPECIES_ID);
    expect(dto.species?.name).toBe('Rosa canina');
    expect(dto.imageUrl).toBe('https://example.com/rose.jpg');
    expect(dto.userId).toBe(USER_ID);
    expect(dto.spaceId).toBe(SPACE_ID);
    expect(dto.createdAt).toBe(NOW);
    expect(dto.updatedAt).toBe(NOW);
  });

  it('maps nullable species and imageUrl as null', () => {
    const vm = new PlantViewModel({
      id: PLANT_ID_2,
      name: 'Cactus',
      plantSpeciesId: null,
      species: null,
      imageUrl: null,
      userId: USER_ID_2,
      spaceId: SPACE_ID_2,
      qrId: null,
      plantingSpotId: null,
      createdAt: NOW,
      updatedAt: NOW,
    });

    const dto = mapper.toResponse(vm);

    expect(dto.name).toBe('Cactus');
    expect(dto.plantSpeciesId).toBeNull();
    expect(dto.species).toBeNull();
    expect(dto.imageUrl).toBeNull();
  });

  it('maps qr object when present', () => {
    const vm = new PlantViewModel({
      id: PLANT_ID,
      name: 'Rose',
      plantSpeciesId: null,
      species: null,
      imageUrl: null,
      userId: USER_ID,
      spaceId: SPACE_ID,
      qrId: QR_ID,
      qr: makeQrData(),
      plantingSpotId: null,
      createdAt: NOW,
      updatedAt: NOW,
    });

    const dto = mapper.toResponse(vm);

    expect(dto.qr).not.toBeNull();
    expect(dto.qr!.id).toBe(QR_ID);
    expect(dto.qr!.image).toBe('aGVsbG93b3JsZA==');
  });

  it('maps qr as null when absent', () => {
    const vm = new PlantViewModel({
      id: PLANT_ID,
      name: 'Rose',
      plantSpeciesId: null,
      species: null,
      imageUrl: null,
      userId: USER_ID,
      spaceId: SPACE_ID,
      qrId: null,
      plantingSpotId: null,
      createdAt: NOW,
      updatedAt: NOW,
    });

    const dto = mapper.toResponse(vm);

    expect(dto.qr).toBeNull();
  });
});
