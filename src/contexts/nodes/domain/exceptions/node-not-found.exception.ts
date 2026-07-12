import { BaseException } from '@sisques-labs/nestjs-kit';

export class NodeNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Node with id '${id}' was not found`);
  }
}
