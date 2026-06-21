import { StringValueObject } from '@sisques-labs/nestjs-kit';

import { InvalidApiTokenHashException } from '@contexts/auth/domain/exceptions/invalid-api-token-hash.exception';

/**
 * SHA-256 hash (64 lowercase hex chars) of the raw API token. The plaintext
 * token is never persisted — only this hash, looked up directly on auth.
 */
export class ApiTokenHashValueObject extends StringValueObject {
  constructor(value: string) {
    super(value);
    if (!/^[0-9a-f]{64}$/.test(value)) {
      throw new InvalidApiTokenHashException();
    }
  }
}
