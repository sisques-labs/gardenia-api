import { FileSizeValueObject } from './file-size.value-object';

describe('FileSizeValueObject', () => {
  it.each([1, 1024, 10 * 1024 * 1024])('accepts positive size %s', (size) => {
    expect(() => new FileSizeValueObject(size)).not.toThrow();
  });

  it.each([0, -1, -2048])('rejects non-positive size %s', (size) => {
    expect(() => new FileSizeValueObject(size)).toThrow();
  });
});
