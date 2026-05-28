import { InvalidRefreshTokenHashException } from '@contexts/auth/domain/exceptions/invalid-refresh-token-hash.exception';
import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class RefreshTokenHashValueObject extends StringValueObject {
  constructor(value: string) {
    super(value);
    this.assertValidHash(value);
  }

  private assertValidHash(value: string): void {
    if (!value || value.length === 0)
      throw new InvalidRefreshTokenHashException();
    if (!/^[0-9a-f]{64}$/.test(value))
      throw new InvalidRefreshTokenHashException();
  }
}
