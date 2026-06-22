import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';
import { PlantSpeciesGraphQLMapper } from './plant-species.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const buildViewModel = (
  overrides: Partial<PlantSpeciesViewModel> = {},
): PlantSpeciesViewModel =>
  new PlantSpeciesViewModel({
    id: ID,
    scientificName: 'Monstera deliciosa',
    description: 'A tropical plant',
    imageUrl: 'https://example.com/m.png',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });

describe('PlantSpeciesGraphQLMapper', () => {
  let mapper: PlantSpeciesGraphQLMapper;

  beforeEach(() => {
    mapper = new PlantSpeciesGraphQLMapper();
  });

  it('maps every field from the view model', () => {
    const dto = mapper.toResponseDtoFromViewModel(buildViewModel());

    expect(dto.id).toBe(ID);
    expect(dto.scientificName).toBe('Monstera deliciosa');
    expect(dto.description).toBe('A tropical plant');
    expect(dto.imageUrl).toBe('https://example.com/m.png');
  });

  it('maps null optional fields', () => {
    const dto = mapper.toResponseDtoFromViewModel(
      buildViewModel({ description: null, imageUrl: null }),
    );

    expect(dto.description).toBeNull();
    expect(dto.imageUrl).toBeNull();
  });

  describe('toPaginatedResponseDto()', () => {
    it('maps items and pagination metadata', () => {
      const dto = mapper.toPaginatedResponseDto(
        new PaginatedResult([buildViewModel()], 1, 1, 10),
      );

      expect(dto.items).toHaveLength(1);
      expect(dto.items[0].id).toBe(ID);
      expect(dto.total).toBe(1);
    });
  });
});
