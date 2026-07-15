import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantIdentificationProviderUnavailableException extends BaseException {
  constructor(reason?: string) {
    super(
      `The plant identification provider is unavailable${reason ? `: ${reason}` : ''}`,
    );
  }
}
