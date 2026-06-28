import { FileNameValueObject } from './file-name.value-object';

describe('FileNameValueObject', () => {
  it('accepts a non-empty filename', () => {
    expect(() => new FileNameValueObject('rose.png')).not.toThrow();
  });

  it.each(['', '   '])('rejects empty/whitespace filename "%s"', (value) => {
    expect(() => new FileNameValueObject(value)).toThrow();
  });

  it('rejects a filename longer than 255 chars', () => {
    expect(() => new FileNameValueObject('a'.repeat(256))).toThrow();
  });
});
