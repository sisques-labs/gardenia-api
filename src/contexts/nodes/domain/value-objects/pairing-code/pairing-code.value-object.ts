import { StringValueObject } from '@sisques-labs/nestjs-kit';

import { InvalidPairingCodeException } from '@contexts/nodes/domain/exceptions/invalid-pairing-code.exception';

const PAIRING_CODE_PATTERN = /^GRDN-[A-Z0-9]{4}$/;

export class PairingCodeValueObject extends StringValueObject {
  constructor(value: string) {
    super(value, { maxLength: 16, allowEmpty: false });
    if (!PAIRING_CODE_PATTERN.test(this.value)) {
      throw new InvalidPairingCodeException(value);
    }
  }

  static generate(): PairingCodeValueObject {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return new PairingCodeValueObject(`GRDN-${suffix}`);
  }
}
