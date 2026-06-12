import { HarvestQuantityValueObject } from './harvest-quantity.value-object';

describe('HarvestQuantityValueObject', () => {
  it('accepts a positive decimal', () => {
    expect(() => new HarvestQuantityValueObject(2.5)).not.toThrow();
    expect(new HarvestQuantityValueObject(2.5).value).toBe(2.5);
  });

  it('accepts quantity of 0.001 (minimum positive)', () => {
    expect(() => new HarvestQuantityValueObject(0.001)).not.toThrow();
  });

  it('throws for zero', () => {
    expect(() => new HarvestQuantityValueObject(0)).toThrow();
  });

  it('throws for negative', () => {
    expect(() => new HarvestQuantityValueObject(-1)).toThrow();
  });
});
