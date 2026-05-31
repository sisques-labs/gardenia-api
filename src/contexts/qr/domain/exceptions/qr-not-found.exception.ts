import { BaseException } from '@sisques-labs/nestjs-kit';

export class QrNotFoundException extends BaseException {
  constructor(id: string) {
    super(`QR with id '${id}' was not found`);
  }
}
