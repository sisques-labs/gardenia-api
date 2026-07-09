import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { PlantingSpotRestMapper } from './planting-spot.mapper';

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
    qrId: null,
    userId: USER_ID,
    spaceId: SPACE_ID,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });

describe('PlantingSpotRestMapper', () => {
  let mapper: PlantingSpotRestMapper;

  beforeEach(() => {
    mapper = new PlantingSpotRestMapper();
  });

  it('maps scalar fields and builds the dimensions object when present', () => {
    const dto = mapper.toResponse(buildViewModel());

    expect(dto.id).toBe(ID);
    expect(dto.name).toBe('Bed A');
    expect(dto.type).toBe(PlantingSpotTypeEnum.RAISED_BED);
    expect(dto.dimensions).toEqual({ width: 100, height: 50, length: 200 });
    expect(dto.status).toBe('active');
    expect(dto.fallowSince).toBeNull();
  });

  it('builds a partial dimensions object when only one value is present', () => {
    const dto = mapper.toResponse(
      buildViewModel({ dimensionsHeight: null, dimensionsLength: null }),
    );

    expect(dto.dimensions).toEqual({ width: 100, height: null, length: null });
  });

  it('sets dimensions to null when no dimension is present', () => {
    const dto = mapper.toResponse(
      buildViewModel({
        dimensionsWidth: null,
        dimensionsHeight: null,
        dimensionsLength: null,
      }),
    );

    expect(dto.dimensions).toBeNull();
  });
});
