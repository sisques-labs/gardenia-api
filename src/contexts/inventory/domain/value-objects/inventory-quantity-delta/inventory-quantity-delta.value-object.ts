import { NumberValueObject } from '@sisques-labs/nestjs-kit';

/**
 * Signed stock adjustment. Negative consumes, positive restocks.
 * No min/max — a delta may be negative; the aggregate clamps the
 * resulting quantity at 0.
 */
export class InventoryQuantityDeltaValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value);
  }
}
