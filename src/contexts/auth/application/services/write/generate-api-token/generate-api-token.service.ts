import { createHash, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { API_TOKEN_PREFIX } from '@contexts/auth/application/constants/api-token.constants';

export interface GeneratedApiToken {
  /** Plaintext token shown to the user exactly once. */
  token: string;
  /** SHA-256 hash persisted in place of the plaintext. */
  hash: string;
}

/**
 * Generates a new API token: a prefixed, random secret plus its SHA-256 hash.
 * The same hashing is reused to look up a presented token on authentication.
 */
@Injectable()
export class GenerateApiTokenService implements IBaseService {
  async execute(): Promise<GeneratedApiToken> {
    const token = `${API_TOKEN_PREFIX}${randomBytes(32).toString('base64url')}`;
    return Promise.resolve({
      token,
      hash: GenerateApiTokenService.hash(token),
    });
  }

  static hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
