import { PlantIdentificationScientificNameValueObject } from './plant-identification-scientific-name.value-object';

describe('PlantIdentificationScientificNameValueObject', () => {
  it('accepts a scientific name', () => {
    expect(
      new PlantIdentificationScientificNameValueObject('Monstera deliciosa')
        .value,
    ).toBe('Monstera deliciosa');
  });

  it('throws for an empty value', () => {
    expect(
      () => new PlantIdentificationScientificNameValueObject(''),
    ).toThrow();
  });

  it('throws for a value over 300 characters', () => {
    expect(
      () => new PlantIdentificationScientificNameValueObject('a'.repeat(301)),
    ).toThrow();
  });
});
