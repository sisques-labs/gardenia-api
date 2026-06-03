import { PlantingSpotFindByIdQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-id/planting-spot-find-by-id.query';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { PlantPlantingSpotBuilder } from '@contexts/plants/domain/builders/plant-planting-spot.builder';
import { QueryBus } from '@nestjs/cqrs';
import { PlantingSpotAdapter } from './planting-spot.adapter';

const SPOT_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
const SPACE_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901';
const USER_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';
const NOW = new Date('2024-01-01T00:00:00Z');

function makeSpotViewModel(): PlantingSpotViewModel {
  return new PlantingSpotViewModel({
    id: SPOT_ID,
    name: 'Balcony',
    type: 'OUTDOOR',
    description: 'Southern balcony',
    userId: USER_ID,
    spaceId: SPACE_ID,
    createdAt: NOW,
    updatedAt: NOW,
  });
}

describe('PlantingSpotAdapter', () => {
  let adapter: PlantingSpotAdapter;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    adapter = new PlantingSpotAdapter(queryBus, new PlantPlantingSpotBuilder());
  });

  it('dispatches PlantingSpotFindByIdQuery and maps result to PlantPlantingSpotViewModel', async () => {
    queryBus.execute.mockResolvedValueOnce(makeSpotViewModel());

    const result = await adapter.findById(SPOT_ID);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(SPOT_ID);
    expect(result!.name).toBe('Balcony');
    expect(result!.type).toBe('OUTDOOR');
    expect(result!.description).toBe('Southern balcony');
    expect(result!.userId).toBe(USER_ID);
    expect(result!.spaceId).toBe(SPACE_ID);
    expect(result!.createdAt).toBe(NOW);
    expect(result!.updatedAt).toBe(NOW);

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    expect(queryBus.execute.mock.calls[0][0]).toBeInstanceOf(
      PlantingSpotFindByIdQuery,
    );
  });

  it('returns null when query throws (spot not found)', async () => {
    queryBus.execute.mockRejectedValueOnce(new Error('Spot not found'));

    const result = await adapter.findById(SPOT_ID);

    expect(result).toBeNull();
  });

  it('returns null when query resolves null', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await adapter.findById(SPOT_ID);

    expect(result).toBeNull();
  });

  it('maps null description correctly', async () => {
    const vm = new PlantingSpotViewModel({
      id: SPOT_ID,
      name: 'Garden',
      type: 'INDOOR',
      description: null,
      userId: USER_ID,
      spaceId: SPACE_ID,
      createdAt: NOW,
      updatedAt: NOW,
    });
    queryBus.execute.mockResolvedValueOnce(vm);

    const result = await adapter.findById(SPOT_ID);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
  });
});
