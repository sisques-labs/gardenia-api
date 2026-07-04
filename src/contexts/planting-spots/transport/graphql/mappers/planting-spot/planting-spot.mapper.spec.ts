import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotPlantViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot-plant.view-model';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { PlantingSpotGraphQLMapper } from './planting-spot.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const buildViewModel = (
  overrides: Partial<PlantingSpotViewModel> = {},
): PlantingSpotViewModel =>
  new PlantingSpotViewModel({
    id: ID,
    name: 'Bed A',
    type: PlantingSpotTypeEnum.RAISED_BED,
    description: 'Near the wall',
    capacity: 12,
    row: 2,
    column: 3,
    dimensionsWidth: 100,
    dimensionsHeight: 50,
    dimensionsLength: 200,
    soilType: 'Loamy',
    status: 'active',
    fallowSince: null,
    userId: USER_ID,
    spaceId: SPACE_ID,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });

describe('PlantingSpotGraphQLMapper', () => {
  let mapper: PlantingSpotGraphQLMapper;

  beforeEach(() => {
    mapper = new PlantingSpotGraphQLMapper();
  });

  describe('toResponseDtoFromViewModel()', () => {
    it('maps every field and initializes resolvedPlants empty', () => {
      const dto = mapper.toResponseDtoFromViewModel(buildViewModel());

      expect(dto.id).toBe(ID);
      expect(dto.name).toBe('Bed A');
      expect(dto.type).toBe(PlantingSpotTypeEnum.RAISED_BED);
      expect(dto.capacity).toBe(12);
      expect(dto.dimensionsWidth).toBe(100);
      expect(dto.resolvedPlants).toEqual([]);
      expect(dto.status).toBe('active');
      expect(dto.fallowSince).toBeNull();
    });

    it('maps null optional fields', () => {
      const dto = mapper.toResponseDtoFromViewModel(
        buildViewModel({
          description: null,
          capacity: null,
          dimensionsWidth: null,
          dimensionsHeight: null,
          dimensionsLength: null,
          soilType: null,
        }),
      );

      expect(dto.description).toBeNull();
      expect(dto.capacity).toBeNull();
      expect(dto.dimensionsWidth).toBeNull();
      expect(dto.soilType).toBeNull();
    });
  });

  describe('toPlantInSpotResponseDto()', () => {
    it('maps the nested plant view model', () => {
      const plant = new PlantingSpotPlantViewModel({
        id: '111e8400-e29b-41d4-a716-446655440000',
        name: 'Basil',
        plantSpeciesId: null,
        imageUrl: null,
        userId: USER_ID,
        spaceId: SPACE_ID,
        createdAt: NOW,
        updatedAt: NOW,
      });

      const dto = mapper.toPlantInSpotResponseDto(plant);

      expect(dto.id).toBe('111e8400-e29b-41d4-a716-446655440000');
      expect(dto.name).toBe('Basil');
      expect(dto.plantSpeciesId).toBeNull();
    });
  });

  describe('toPaginatedResponseDto()', () => {
    it('maps items and pagination metadata', () => {
      const dto = mapper.toPaginatedResponseDto(
        new PaginatedResult([buildViewModel()], 1, 1, 10),
      );

      expect(dto.items).toHaveLength(1);
      expect(dto.total).toBe(1);
    });
  });
});
