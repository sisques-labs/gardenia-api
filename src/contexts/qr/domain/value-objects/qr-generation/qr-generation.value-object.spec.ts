import { QrGenerationValueObject } from './qr-generation.value-object';

describe('QrGenerationValueObject', () => {
  it('wraps a generation number', () => {
    expect(new QrGenerationValueObject(1).value).toBe(1);
  });

  it('accepts zero', () => {
    expect(new QrGenerationValueObject(0).value).toBe(0);
  });

  describe('increment()', () => {
    it('returns a new VO with the value increased by one', () => {
      const vo = new QrGenerationValueObject(1);

      const next = vo.increment();

      expect(next.value).toBe(2);
    });

    it('does not mutate the original VO', () => {
      const vo = new QrGenerationValueObject(5);

      vo.increment();

      expect(vo.value).toBe(5);
    });

    it('can be chained', () => {
      const vo = new QrGenerationValueObject(0);

      expect(vo.increment().increment().increment().value).toBe(3);
    });
  });
});
