import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class RefreshTokenHashValueObject extends StringValueObject {
  constructor(value: string) {
    super(value);
    this.assertValidHash(value);
  }

  private assertValidHash(value: string): void {
    if (!value || value.length === 0) {
      throw new Error('RefreshTokenHash cannot be empty');
    }
    if (!/^[0-9a-f]{64}$/.test(value)) {
      throw new Error(
        'RefreshTokenHash must be exactly 64 lowercase hex characters (SHA-256)',
      );
    }
  }
}
