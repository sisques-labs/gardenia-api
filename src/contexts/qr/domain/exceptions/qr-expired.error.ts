import { BaseException } from '@sisques-labs/nestjs-kit';

export class QrExpiredError extends BaseException {
  constructor(id: string) {
    super(`QR with id '${id}' has expired`);
  }
}
