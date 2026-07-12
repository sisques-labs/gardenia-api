import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvalidPairingCodeException extends BaseException {
  constructor(code: string) {
    super(`Pairing code '${code}' is invalid or does not match`);
  }
}
