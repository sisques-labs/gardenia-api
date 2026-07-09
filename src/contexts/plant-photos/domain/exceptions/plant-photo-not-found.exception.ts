import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantPhotoNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Plant photo with id '${id}' was not found`);
  }
}
