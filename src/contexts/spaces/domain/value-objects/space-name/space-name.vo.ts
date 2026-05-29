import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvalidSpaceNameException extends BaseException {
  constructor(reason: string) {
    super(`Invalid space name: ${reason}`);
  }
}

export class SpaceNameVO {
  static readonly MAX_LENGTH = 100;

  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new InvalidSpaceNameException('name cannot be empty or blank');
    }

    if (value.length > SpaceNameVO.MAX_LENGTH) {
      throw new InvalidSpaceNameException(
        `name cannot exceed ${SpaceNameVO.MAX_LENGTH} characters`,
      );
    }

    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  equals(other: SpaceNameVO): boolean {
    return this._value === other._value;
  }
}
