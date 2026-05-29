import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

export class SpaceNameValueObject {
  static readonly MAX_LENGTH = 100;

  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new FieldIsRequiredException('name');
    }

    if (value.length > SpaceNameValueObject.MAX_LENGTH) {
      throw new Error(
        `Space name cannot exceed ${SpaceNameValueObject.MAX_LENGTH} characters`,
      );
    }

    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  equals(other: SpaceNameValueObject): boolean {
    return this._value === other._value;
  }
}
