import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';
import { PlantSpeciesRestMapper } from './plant-species.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const buildViewModel = (
  overrides: Partial<PlantSpeciesViewModel> = {},
): PlantSpeciesViewModel =>
  new PlantSpeciesViewModel({
    id: ID,
    scientificName: 'Monstera deliciosa',
    gbifKey: 2882337,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });

describe('PlantSpeciesRestMapper', () => {
  let mapper: PlantSpeciesRestMapper;

  beforeEach(() => {
    mapper = new PlantSpeciesRestMapper();
  });

  it('maps every field from the view model', () => {
    const dto = mapper.toResponse(buildViewModel());

    expect(dto.id).toBe(ID);
    expect(dto.scientificName).toBe('Monstera deliciosa');
    expect(dto.gbifKey).toBe(2882337);
  });

  it('maps a null gbifKey', () => {
    const dto = mapper.toResponse(buildViewModel({ gbifKey: null }));

    expect(dto.gbifKey).toBeNull();
  });
});
