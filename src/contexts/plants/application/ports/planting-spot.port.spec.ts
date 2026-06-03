import { PLANTING_SPOT_PORT, IPlantingSpotPort } from './planting-spot.port';
import { PlantPlantingSpotViewModel } from '@contexts/plants/domain/view-models/plant-planting-spot.view-model';

describe('planting-spot.port', () => {
  it('exports a unique symbol for the port token', () => {
    expect(typeof PLANTING_SPOT_PORT).toBe('symbol');
    expect(PLANTING_SPOT_PORT.toString()).toContain('PLANTING_SPOT_PORT');
  });

  it('IPlantingSpotPort contract: findById returns PlantPlantingSpotViewModel or null', async () => {
    const NOW = new Date('2024-01-01T00:00:00Z');
    const mockImpl: IPlantingSpotPort = {
      findById: async (_id: string, _spaceId: string) =>
        new PlantPlantingSpotViewModel({
          id: 'spot-id',
          name: 'Balcony',
          type: 'OUTDOOR',
          description: null,
          userId: 'user-id',
          spaceId: 'space-id',
          createdAt: NOW,
          updatedAt: NOW,
        }),
    };

    const result = await mockImpl.findById('spot-id', 'space-id');

    expect(result).not.toBeNull();
    expect(result!.name).toBe('Balcony');
  });
});
