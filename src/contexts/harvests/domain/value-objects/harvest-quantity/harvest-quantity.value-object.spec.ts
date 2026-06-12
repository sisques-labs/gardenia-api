import { InvalidHarvestQuantityException } from '@contexts/harvests/domain/exceptions/invalid-harvest-quantity.exception';
import { HarvestQuantityValueObject } from './harvest-quantity.value-object';

describe('HarvestQuantityValueObject', () => {
  it('accepts a positive decimal', () => {
    expect(() => new HarvestQuantityValueObject(2.5)).not.toThrow();
    expect(new HarvestQuantityValueObject(2.5).value).toBe(2.5);
  });

  it('accepts quantity of 0.001 (minimum positive)', () => {
    expect(() => new HarvestQuantityValueObject(0.001)).not.toThrow();
  });

  it('throws InvalidHarvestQuantityException for zero', () => {
    expect(() => new HarvestQuantityValueObject(0)).toThrow(
      InvalidHarvestQuantityException,
    );
  });

  it('throws InvalidHarvestQuantityException for negative', () => {
    expect(() => new HarvestQuantityValueObject(-1)).toThrow(
      InvalidHarvestQuantityException,
    );
  });
});
