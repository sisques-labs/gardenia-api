import { PlantingSpotDescriptionValueObject } from './planting-spot-description.value-object';

describe('PlantingSpotDescriptionValueObject', () => {
  it('wraps a non-empty description', () => {
    expect(
      new PlantingSpotDescriptionValueObject('Raised bed near the wall').value,
    ).toBe('Raised bed near the wall');
  });

  it('allows an empty string (description is optional)', () => {
    expect(() => new PlantingSpotDescriptionValueObject('')).not.toThrow();
    expect(new PlantingSpotDescriptionValueObject('').value).toBe('');
  });

  it('accepts a description of exactly MAX_LENGTH chars', () => {
    const desc = 'a'.repeat(PlantingSpotDescriptionValueObject.MAX_LENGTH);

    expect(() => new PlantingSpotDescriptionValueObject(desc)).not.toThrow();
  });

  it('throws for a description longer than MAX_LENGTH', () => {
    const desc = 'a'.repeat(PlantingSpotDescriptionValueObject.MAX_LENGTH + 1);

    expect(() => new PlantingSpotDescriptionValueObject(desc)).toThrow();
  });
});
