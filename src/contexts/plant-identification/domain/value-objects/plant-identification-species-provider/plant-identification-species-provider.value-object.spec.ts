import { PlantIdentificationSpeciesProviderValueObject } from './plant-identification-species-provider.value-object';

describe('PlantIdentificationSpeciesProviderValueObject', () => {
  it('accepts a provider name', () => {
    expect(
      new PlantIdentificationSpeciesProviderValueObject('gbif').value,
    ).toBe('gbif');
  });

  it('throws for an empty value', () => {
    expect(
      () => new PlantIdentificationSpeciesProviderValueObject(''),
    ).toThrow();
  });

  it('throws for a value over 50 characters', () => {
    expect(
      () => new PlantIdentificationSpeciesProviderValueObject('a'.repeat(51)),
    ).toThrow();
  });
});
