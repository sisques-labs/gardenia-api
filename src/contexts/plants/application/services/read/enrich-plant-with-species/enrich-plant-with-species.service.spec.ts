import { IPlantSpeciesPort } from '@contexts/plants/application/ports/plant-species.port';
import { PlantBuilder } from '@contexts/plants/domain/builders/plant.builder';
import { PlantSpeciesViewModel } from '@contexts/plants/domain/view-models/plant-species.view-model';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { EnrichPlantWithSpeciesService } from './enrich-plant-with-species.service';

const PLANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const SPECIES_ID = '880e8400-e29b-41d4-a716-446655440003';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const buildPlant = (overrides: Partial<PlantViewModel> = {}): PlantViewModel =>
  new PlantViewModel({
    id: PLANT_ID,
    name: 'Aloe',
    plantSpeciesId: SPECIES_ID,
    species: null,
    imageUrl: null,
    userId: USER_ID,
    spaceId: SPACE_ID,
    qrId: null,
    qr: null,
    plantingSpotId: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });

const speciesData = (): PlantSpeciesViewModel =>
  new PlantSpeciesViewModel({
    id: SPECIES_ID,
    scientificName: 'Aloe vera',
    gbifKey: 2977863,
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('EnrichPlantWithSpeciesService', () => {
  let service: EnrichPlantWithSpeciesService;
  let speciesPort: jest.Mocked<IPlantSpeciesPort>;

  beforeEach(() => {
    jest.clearAllMocks();
    speciesPort = {
      findByPlantSpeciesId: jest.fn(),
      findOrCreateByGbifKey: jest.fn(),
    } as unknown as jest.Mocked<IPlantSpeciesPort>;
    service = new EnrichPlantWithSpeciesService(
      new PlantBuilder(),
      speciesPort,
    );
  });

  it('returns the plant untouched when it has no linked species', async () => {
    const plant = buildPlant({ plantSpeciesId: null });

    const result = await service.execute(plant);

    expect(result).toBe(plant);
    expect(speciesPort.findByPlantSpeciesId).not.toHaveBeenCalled();
  });

  it('returns the plant untouched when the species is not found', async () => {
    speciesPort.findByPlantSpeciesId.mockResolvedValue(null);
    const plant = buildPlant();

    const result = await service.execute(plant);

    expect(result).toBe(plant);
    expect(result.species).toBeNull();
  });

  it('returns a new view model enriched with the species data', async () => {
    speciesPort.findByPlantSpeciesId.mockResolvedValue(speciesData());
    const plant = buildPlant();

    const result = await service.execute(plant);

    expect(speciesPort.findByPlantSpeciesId).toHaveBeenCalledWith(SPECIES_ID);
    expect(result.id).toBe(PLANT_ID);
    expect(result.species).not.toBeNull();
    expect(result.species?.scientificName).toBe('Aloe vera');
  });
});
