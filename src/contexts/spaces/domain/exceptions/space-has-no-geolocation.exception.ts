import { BaseException } from '@sisques-labs/nestjs-kit';

export class SpaceHasNoGeolocationException extends BaseException {
  constructor(id: string) {
    super(`Space with id '${id}' has no geolocation set`);
  }
}
