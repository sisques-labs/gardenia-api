import { QrTargetUrlValueObject } from './qr-target-url.value-object';

describe('QrTargetUrlValueObject', () => {
  it('wraps a valid target URL', () => {
    const url = 'https://example.com/plant/123';

    expect(new QrTargetUrlValueObject(url).value).toBe(url);
  });

  it('throws for an empty string', () => {
    expect(() => new QrTargetUrlValueObject('')).toThrow();
  });

  it('accepts a URL of exactly MAX_LENGTH chars', () => {
    const url = `https://e.co/${'a'.repeat(2000 - 13)}`;

    expect(url.length).toBe(2000);
    expect(() => new QrTargetUrlValueObject(url)).not.toThrow();
  });

  it('throws for a URL longer than MAX_LENGTH', () => {
    const url = `https://e.co/${'a'.repeat(2000)}`;

    expect(() => new QrTargetUrlValueObject(url)).toThrow();
  });
});
