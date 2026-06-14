import { BaseException } from '@sisques-labs/nestjs-kit';

export class HarvestNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Harvest with id '${id}' was not found`);
  }
}
