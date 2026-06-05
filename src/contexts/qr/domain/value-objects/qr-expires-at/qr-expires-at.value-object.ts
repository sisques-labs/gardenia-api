export class QrExpiresAtValueObject {
  readonly value: Date | null;

  constructor(value: Date | null) {
    this.value = value;
  }
}
