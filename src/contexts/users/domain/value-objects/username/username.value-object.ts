import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { InvalidUsernameFormatException } from '@contexts/users/domain/exceptions/invalid-username-format.exception';
import { InvalidUsernameLengthException } from '@contexts/users/domain/exceptions/invalid-username-length.exception';

export class UsernameValueObject {
  private readonly _value: string;

  static readonly MIN_LENGTH = 3;
  static readonly MAX_LENGTH = 30;
  static readonly PATTERN = /^[a-z0-9_]+$/;

  constructor(value: string) {
    if (!value) throw new FieldIsRequiredException('username');

    const normalized = value.toLowerCase().trim();

    if (
      normalized.length < UsernameValueObject.MIN_LENGTH ||
      normalized.length > UsernameValueObject.MAX_LENGTH
    ) {
      throw new InvalidUsernameLengthException(normalized);
    }

    if (!UsernameValueObject.PATTERN.test(normalized)) {
      throw new InvalidUsernameFormatException(normalized);
    }

    this._value = normalized;
  }

  get value(): string {
    return this._value;
  }

  equals(other: UsernameValueObject): boolean {
    return this._value === other._value;
  }
}
