import { PlantSpeciesDescriptionValueObject } from './plant-species-description.value-object';

describe('PlantSpeciesDescriptionValueObject', () => {
  it('wraps a non-empty description', () => {
    expect(
      new PlantSpeciesDescriptionValueObject('A tropical climbing plant.')
        .value,
    ).toBe('A tropical climbing plant.');
  });

  it('throws for an empty string', () => {
    expect(() => new PlantSpeciesDescriptionValueObject('')).toThrow();
  });

  it('accepts a description of exactly MAX_LENGTH chars', () => {
    const desc = 'a'.repeat(PlantSpeciesDescriptionValueObject.MAX_LENGTH);

    expect(() => new PlantSpeciesDescriptionValueObject(desc)).not.toThrow();
  });

  it('throws for a description longer than MAX_LENGTH', () => {
    const desc = 'a'.repeat(PlantSpeciesDescriptionValueObject.MAX_LENGTH + 1);

    expect(() => new PlantSpeciesDescriptionValueObject(desc)).toThrow();
  });
});
