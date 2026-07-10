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
    gbifKey: 2882337,
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
    expect(dto.gbifKey).toBe(2882337);
  });

  it('maps a null gbifKey', () => {
    const dto = mapper.toResponseDtoFromViewModel(
      buildViewModel({ gbifKey: null }),
    );

    expect(dto.gbifKey).toBeNull();
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

  describe('toSuggestionResponseDto()', () => {
    it('maps a gbif suggestion', () => {
      const dto = mapper.toSuggestionResponseDto({
        gbifKey: 2882337,
        scientificName: 'Monstera deliciosa',
      });

      expect(dto).toEqual({
        gbifKey: 2882337,
        scientificName: 'Monstera deliciosa',
      });
    });
  });
});
