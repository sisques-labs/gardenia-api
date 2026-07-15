import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantPhotoForbiddenException extends BaseException {
  constructor(id: string) {
    super(`User is not allowed to delete plant photo '${id}'`);
  }
}
