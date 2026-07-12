import { BaseException } from '@sisques-labs/nestjs-kit';

export class BridgeAlreadyClaimedException extends BaseException {
  constructor(id: string) {
    super(`Bridge with id '${id}' is already claimed`);
  }
}
