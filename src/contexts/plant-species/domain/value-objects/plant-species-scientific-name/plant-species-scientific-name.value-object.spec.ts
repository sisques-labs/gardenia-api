import { PlantSpeciesScientificNameValueObject } from './plant-species-scientific-name.value-object';

describe('PlantSpeciesScientificNameValueObject', () => {
  it('wraps a non-empty scientific name', () => {
    expect(
      new PlantSpeciesScientificNameValueObject('Monstera deliciosa').value,
    ).toBe('Monstera deliciosa');
  });

  it('trims surrounding whitespace', () => {
    expect(
      new PlantSpeciesScientificNameValueObject('  Ficus lyrata  ').value,
    ).toBe('Ficus lyrata');
  });

  it('throws for an empty string', () => {
    expect(() => new PlantSpeciesScientificNameValueObject('')).toThrow();
  });

  it('throws for a whitespace-only string (empty after trim)', () => {
    expect(() => new PlantSpeciesScientificNameValueObject('   ')).toThrow();
  });

  it('accepts a name of exactly MAX_LENGTH chars', () => {
    const name = 'a'.repeat(PlantSpeciesScientificNameValueObject.MAX_LENGTH);

    expect(() => new PlantSpeciesScientificNameValueObject(name)).not.toThrow();
  });

  it('throws for a name longer than MAX_LENGTH', () => {
    const name = 'a'.repeat(
      PlantSpeciesScientificNameValueObject.MAX_LENGTH + 1,
    );

    expect(() => new PlantSpeciesScientificNameValueObject(name)).toThrow();
  });
});
