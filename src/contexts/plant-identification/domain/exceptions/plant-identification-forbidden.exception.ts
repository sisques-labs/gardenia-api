import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantIdentificationForbiddenException extends BaseException {
  constructor(id: string) {
    super(`User is not allowed to convert plant identification '${id}'`);
  }
}
