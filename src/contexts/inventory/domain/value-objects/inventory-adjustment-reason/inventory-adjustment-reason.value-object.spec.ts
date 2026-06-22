import { InventoryAdjustmentReasonValueObject } from './inventory-adjustment-reason.value-object';

describe('InventoryAdjustmentReasonValueObject', () => {
  it('wraps a non-empty reason', () => {
    const vo = new InventoryAdjustmentReasonValueObject('Used for repotting');

    expect(vo.value).toBe('Used for repotting');
  });

  it('throws for an empty string', () => {
    expect(() => new InventoryAdjustmentReasonValueObject('')).toThrow();
  });

  it('accepts a reason of exactly MAX_LENGTH chars', () => {
    const reason = 'a'.repeat(InventoryAdjustmentReasonValueObject.MAX_LENGTH);

    expect(
      () => new InventoryAdjustmentReasonValueObject(reason),
    ).not.toThrow();
  });

  it('throws for a reason longer than MAX_LENGTH', () => {
    const reason = 'a'.repeat(
      InventoryAdjustmentReasonValueObject.MAX_LENGTH + 1,
    );

    expect(() => new InventoryAdjustmentReasonValueObject(reason)).toThrow();
  });
});
