import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';
import { BaseException } from '@sisques-labs/nestjs-kit';

export class TaskNameTooLongException extends BaseException {
  constructor() {
    super('Task name must not exceed 255 characters');
  }
}

export class TaskNameValueObject {
  private readonly _value: string;
  static readonly MAX_LENGTH = 255;

  constructor(value: string) {
    if (!value?.trim()) throw new FieldIsRequiredException('name');
    if (value.trim().length > TaskNameValueObject.MAX_LENGTH) {
      throw new TaskNameTooLongException();
    }
    this._value = value.trim();
  }

  get value(): string {
    return this._value;
  }
}
