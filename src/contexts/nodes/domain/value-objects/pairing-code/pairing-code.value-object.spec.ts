import { InvalidPairingCodeException } from '@contexts/nodes/domain/exceptions/invalid-pairing-code.exception';
import { PairingCodeValueObject } from './pairing-code.value-object';

describe('PairingCodeValueObject', () => {
  it('accepts a well-formed code', () => {
    expect(() => new PairingCodeValueObject('GRDN-4F7K')).not.toThrow();
  });

  it('rejects a malformed code', () => {
    expect(() => new PairingCodeValueObject('not-a-code')).toThrow(
      InvalidPairingCodeException,
    );
  });

  it('rejects a lowercase code', () => {
    expect(() => new PairingCodeValueObject('grdn-4f7k')).toThrow(
      InvalidPairingCodeException,
    );
  });

  describe('generate()', () => {
    it('produces a code matching the expected format', () => {
      const code = PairingCodeValueObject.generate();
      expect(code.value).toMatch(/^GRDN-[A-Z0-9]{4}$/);
    });

    it('produces different codes across calls (extremely unlikely collision)', () => {
      const a = PairingCodeValueObject.generate();
      const b = PairingCodeValueObject.generate();
      expect(a.value === b.value).toBe(false);
    });
  });
});
