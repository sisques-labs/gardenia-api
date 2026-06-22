import { QrPngGeneratorService } from './qr-png-generator.service';

describe('QrPngGeneratorService', () => {
  let service: QrPngGeneratorService;

  beforeEach(() => {
    service = new QrPngGeneratorService();
  });

  it('generates a non-empty PNG buffer for the given URL', async () => {
    const buffer = await service.generate('https://gardenia.app/plant/1');

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('produces a buffer with the PNG file signature', async () => {
    const buffer = await service.generate('https://gardenia.app/plant/1');

    // PNG magic number: 89 50 4E 47 0D 0A 1A 0A
    const pngSignature = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    expect(buffer.subarray(0, 8).equals(pngSignature)).toBe(true);
  });

  it('produces different output for different URLs', async () => {
    const a = await service.generate('https://gardenia.app/plant/1');
    const b = await service.generate('https://gardenia.app/plant/2');

    expect(a.equals(b)).toBe(false);
  });
});
