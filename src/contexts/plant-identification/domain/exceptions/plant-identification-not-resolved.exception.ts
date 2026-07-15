import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantIdentificationNotResolvedException extends BaseException {
  constructor(id: string) {
    super(
      `Plant identification '${id}' has no resolved species and cannot be converted to a plant`,
    );
  }
}
