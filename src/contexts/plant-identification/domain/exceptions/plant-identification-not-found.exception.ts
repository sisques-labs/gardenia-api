import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantIdentificationNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Plant identification with id '${id}' was not found`);
  }
}
