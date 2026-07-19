import { PlantIdentificationCommonNameValueObject } from './plant-identification-common-name.value-object';

describe('PlantIdentificationCommonNameValueObject', () => {
  it('accepts a common name', () => {
    expect(
      new PlantIdentificationCommonNameValueObject('Swiss cheese plant').value,
    ).toBe('Swiss cheese plant');
  });

  it('throws for an empty value', () => {
    expect(() => new PlantIdentificationCommonNameValueObject('')).toThrow();
  });

  it('throws for a value over 200 characters', () => {
    expect(
      () => new PlantIdentificationCommonNameValueObject('a'.repeat(201)),
    ).toThrow();
  });
});
