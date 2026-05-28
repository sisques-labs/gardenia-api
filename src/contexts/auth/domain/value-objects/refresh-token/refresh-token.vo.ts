import { InvalidRefreshTokenValueException } from '@contexts/auth/domain/exceptions/invalid-refresh-token-value.exception';
import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class RefreshTokenValueObject extends StringValueObject {
  constructor(value: string) {
    super(value);
    this.ensureNotEmpty(value);
  }

  private ensureNotEmpty(value: string): void {
    if (!value?.trim()) {
      throw new InvalidRefreshTokenValueException();
    }
  }
}
