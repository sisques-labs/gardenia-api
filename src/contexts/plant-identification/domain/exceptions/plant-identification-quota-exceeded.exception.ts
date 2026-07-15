import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantIdentificationQuotaExceededException extends BaseException {
  constructor() {
    super('The plant identification provider quota has been exceeded');
  }
}
