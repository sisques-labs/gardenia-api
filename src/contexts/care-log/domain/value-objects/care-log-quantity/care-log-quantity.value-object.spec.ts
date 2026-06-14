import { CareLogQuantityValueObject } from './care-log-quantity.value-object';

describe('CareLogQuantityValueObject', () => {
  it('should not throw for a positive number', () => {
    expect(() => new CareLogQuantityValueObject(100)).not.toThrow();
  });

  it('should not throw for the minimum value of 1', () => {
    expect(() => new CareLogQuantityValueObject(1)).not.toThrow();
  });

  it('should throw for zero', () => {
    expect(() => new CareLogQuantityValueObject(0)).toThrow();
  });

  it('should throw for a negative number', () => {
    expect(() => new CareLogQuantityValueObject(-5)).toThrow();
  });
});
