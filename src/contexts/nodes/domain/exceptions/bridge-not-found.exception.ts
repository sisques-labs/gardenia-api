import { BaseException } from '@sisques-labs/nestjs-kit';

export class BridgeNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Bridge with id '${id}' was not found`);
  }
}
