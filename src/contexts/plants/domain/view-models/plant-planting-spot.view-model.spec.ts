import { PlantPlantingSpotViewModel } from './plant-planting-spot.view-model';

const ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';
const USER_ID = 'b2c3d4e5-f6a7-4901-bcde-f12345678901';
const SPACE_ID = 'c3d4e5f6-a7b8-4012-cdef-123456789012';
const NOW = new Date('2024-01-01T00:00:00Z');

describe('PlantPlantingSpotViewModel', () => {
  it('stores all required fields', () => {
    const vm = new PlantPlantingSpotViewModel({
      id: ID,
      name: 'Terraza Norte',
      type: 'OUTDOOR',
      description: 'Northern terrace',
      userId: USER_ID,
      spaceId: SPACE_ID,
      createdAt: NOW,
      updatedAt: NOW,
    });

    expect(vm.id).toBe(ID);
    expect(vm.name).toBe('Terraza Norte');
    expect(vm.type).toBe('OUTDOOR');
    expect(vm.description).toBe('Northern terrace');
    expect(vm.userId).toBe(USER_ID);
    expect(vm.spaceId).toBe(SPACE_ID);
    expect(vm.createdAt).toBe(NOW);
    expect(vm.updatedAt).toBe(NOW);
  });

  it('stores null description', () => {
    const vm = new PlantPlantingSpotViewModel({
      id: ID,
      name: 'Terraza Norte',
      type: 'OUTDOOR',
      description: null,
      userId: USER_ID,
      spaceId: SPACE_ID,
      createdAt: NOW,
      updatedAt: NOW,
    });

    expect(vm.description).toBeNull();
  });
});
