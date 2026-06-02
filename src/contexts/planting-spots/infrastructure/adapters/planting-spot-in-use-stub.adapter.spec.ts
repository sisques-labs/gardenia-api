import { PlantingSpotInUseStubAdapter } from './planting-spot-in-use-stub.adapter';

describe('PlantingSpotInUseStubAdapter', () => {
  let adapter: PlantingSpotInUseStubAdapter;

  beforeEach(() => {
    adapter = new PlantingSpotInUseStubAdapter();
  });

  it('should always return 0 regardless of the id provided', async () => {
    const result = await adapter.countByPlantingSpotId('any-id');
    expect(result).toBe(0);
  });

  it('should return 0 for any planting spot id', async () => {
    const result1 = await adapter.countByPlantingSpotId('spot-uuid-1');
    const result2 = await adapter.countByPlantingSpotId('spot-uuid-2');
    expect(result1).toBe(0);
    expect(result2).toBe(0);
  });
});
