import { QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { PlantingSpotPlantBuilder } from '@contexts/planting-spots/domain/builders/planting-spot-plant.builder';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { PlantingSpotPlantsAdapter } from './planting-spot-plants.adapter';

const SPOT_ID = 'aa0e8400-e29b-41d4-a716-446655440005';
const PLANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const plant = (): PlantViewModel =>
  new PlantViewModel({
    id: PLANT_ID,
    name: 'Basil',
    plantSpeciesId: null,
    species: null,
    imageUrl: null,
    userId: USER_ID,
    spaceId: SPACE_ID,
    qrId: null,
    qr: null,
    plantingSpotId: SPOT_ID,
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('PlantingSpotPlantsAdapter', () => {
  let adapter: PlantingSpotPlantsAdapter;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    jest.clearAllMocks();
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    adapter = new PlantingSpotPlantsAdapter(
      queryBus,
      new PlantingSpotPlantBuilder(),
    );
  });

  it('maps each plant of the planting spot into a plant view model', async () => {
    queryBus.execute.mockResolvedValue(
      new PaginatedResult([plant()], 1, 1, 500),
    );

    const result = await adapter.findByPlantingSpotId(SPOT_ID);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(PLANT_ID);
    expect(result[0].name).toBe('Basil');
    expect(result[0].plantSpeciesId).toBeNull();
  });

  it('returns an empty array when the planting spot has no plants', async () => {
    queryBus.execute.mockResolvedValue(new PaginatedResult([], 0, 1, 500));

    expect(await adapter.findByPlantingSpotId(SPOT_ID)).toEqual([]);
  });
});
