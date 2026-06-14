import { BaseException } from '@sisques-labs/nestjs-kit';

export class CareLogQuantityUnitMismatchException extends BaseException {
  constructor() {
    super('quantity and unit must both be provided or both omitted');
  }
}
