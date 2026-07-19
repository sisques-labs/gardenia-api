import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantNetApiKeyMissingException extends BaseException {
  constructor() {
    super('PLANTNET_API_KEY is required for the plant-identification context');
  }
}
