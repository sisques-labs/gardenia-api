import { PlantIdentificationNameValueObject } from './plant-identification-name.value-object';

describe('PlantIdentificationNameValueObject', () => {
  it('accepts a valid name', () => {
    expect(new PlantIdentificationNameValueObject('My Monstera').value).toBe(
      'My Monstera',
    );
  });

  it('throws for an empty name', () => {
    expect(() => new PlantIdentificationNameValueObject('')).toThrow();
  });

  it('throws for a name over 100 characters', () => {
    expect(
      () => new PlantIdentificationNameValueObject('a'.repeat(101)),
    ).toThrow();
  });
});
