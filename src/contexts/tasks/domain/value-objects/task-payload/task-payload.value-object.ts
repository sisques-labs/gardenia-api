export class TaskPayloadValueObject {
  private readonly _value: Record<string, unknown>;

  constructor(value: Record<string, unknown>) {
    this._value = value ?? {};
  }

  get value(): Record<string, unknown> {
    return this._value;
  }
}
