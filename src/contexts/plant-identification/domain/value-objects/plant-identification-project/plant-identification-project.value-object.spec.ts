import { PlantIdentificationProjectValueObject } from './plant-identification-project.value-object';

describe('PlantIdentificationProjectValueObject', () => {
  it('accepts a project slug', () => {
    expect(new PlantIdentificationProjectValueObject('all').value).toBe('all');
  });

  it('throws for an empty value', () => {
    expect(() => new PlantIdentificationProjectValueObject('')).toThrow();
  });

  it('throws for a value over 50 characters', () => {
    expect(
      () => new PlantIdentificationProjectValueObject('a'.repeat(51)),
    ).toThrow();
  });
});
