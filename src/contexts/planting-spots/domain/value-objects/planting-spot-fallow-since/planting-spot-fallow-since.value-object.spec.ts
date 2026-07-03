import { PlantingSpotFallowSinceValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-fallow-since/planting-spot-fallow-since.value-object';

describe('PlantingSpotFallowSinceValueObject', () => {
  it('should accept a valid date', () => {
    const date = new Date('2026-07-03T00:00:00.000Z');
    const vo = new PlantingSpotFallowSinceValueObject(date);
    expect(vo.value).toEqual(date);
  });
});
