import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvalidHarvestQuantityException extends BaseException {
  constructor(value: number) {
    super(`Harvest quantity must be greater than 0, got: ${value}`);
  }
}
