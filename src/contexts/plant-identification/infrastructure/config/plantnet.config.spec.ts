import { plantnetConfig } from './plantnet.config';

describe('plantnetConfig', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.PLANTNET_API_KEY;
    delete process.env.PLANTNET_PROJECT;
    delete process.env.PLANTNET_MIN_CONFIDENCE;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('throws fast when PLANTNET_API_KEY is not set', () => {
    expect(() => plantnetConfig()).toThrow(/PLANTNET_API_KEY is required/);
  });

  it('does not throw when PLANTNET_API_KEY is set', () => {
    process.env.PLANTNET_API_KEY = 'secret-key';
    expect(() => plantnetConfig()).not.toThrow();
  });

  it('defaults project to "all" and minConfidence to 0.2', () => {
    process.env.PLANTNET_API_KEY = 'secret-key';
    const config = plantnetConfig();
    expect(config.project).toBe('all');
    expect(config.minConfidence).toBe(0.2);
  });

  it('reads PLANTNET_PROJECT and PLANTNET_MIN_CONFIDENCE when set', () => {
    process.env.PLANTNET_API_KEY = 'secret-key';
    process.env.PLANTNET_PROJECT = 'weurope';
    process.env.PLANTNET_MIN_CONFIDENCE = '0.35';

    const config = plantnetConfig();
    expect(config.project).toBe('weurope');
    expect(config.minConfidence).toBe(0.35);
  });

  it('falls back to the default minConfidence for an out-of-range value', () => {
    process.env.PLANTNET_API_KEY = 'secret-key';
    process.env.PLANTNET_MIN_CONFIDENCE = '5';

    const config = plantnetConfig();
    expect(config.minConfidence).toBe(0.2);
  });
});
