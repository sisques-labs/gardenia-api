import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class RefreshTokenValueObject extends StringValueObject {
  constructor(value: string) {
    super(value);
    this.ensureNotEmpty(value);
  }

  private ensureNotEmpty(value: string): void {
    if (!value?.trim()) {
      throw new Error('Refresh token is required');
    }
  }
}
