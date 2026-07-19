import { PlantIdentificationResolvedScientificNameValueObject } from './plant-identification-resolved-scientific-name.value-object';

describe('PlantIdentificationResolvedScientificNameValueObject', () => {
  it('accepts a scientific name', () => {
    expect(
      new PlantIdentificationResolvedScientificNameValueObject(
        'Monstera deliciosa',
      ).value,
    ).toBe('Monstera deliciosa');
  });

  it('throws for an empty value', () => {
    expect(
      () => new PlantIdentificationResolvedScientificNameValueObject(''),
    ).toThrow();
  });

  it('throws for a value over 300 characters', () => {
    expect(
      () =>
        new PlantIdentificationResolvedScientificNameValueObject(
          'a'.repeat(301),
        ),
    ).toThrow();
  });
});
