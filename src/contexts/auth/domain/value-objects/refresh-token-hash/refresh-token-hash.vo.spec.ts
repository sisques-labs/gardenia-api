import { RefreshTokenHashValueObject } from './refresh-token-hash.vo';

describe('RefreshTokenHashValueObject', () => {
  it('should reject empty string', () => {
    expect(() => new RefreshTokenHashValueObject('')).toThrow();
  });

  it('should reject string not exactly 64 hex chars', () => {
    expect(() => new RefreshTokenHashValueObject('abc123')).toThrow();
    expect(() => new RefreshTokenHashValueObject('a'.repeat(63))).toThrow();
    expect(
      () =>
        new RefreshTokenHashValueObject(
          'z'.repeat(64), // not valid hex
        ),
    ).toThrow();
  });

  it('should accept valid 64-char lowercase hex string', () => {
    const valid = 'a3b4c5d6'.repeat(8); // 64 chars, valid hex
    expect(() => new RefreshTokenHashValueObject(valid)).not.toThrow();
    const vo = new RefreshTokenHashValueObject(valid);
    expect(vo.value).toBe(valid);
  });
});
