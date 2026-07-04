import {
  DEFAULT_ALLOWED_MIME_TYPES,
  DEFAULT_MAX_FILE_SIZE_BYTES,
  filesConfig,
} from './files.config';

describe('filesConfig', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.FILES_MAX_SIZE_BYTES;
    delete process.env.FILES_ALLOWED_MIME_TYPES;
    delete process.env.FILES_PUBLIC_BASE_URL;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('should default maxSizeBytes when FILES_MAX_SIZE_BYTES is unset', () => {
    const config = filesConfig();

    expect(config.maxSizeBytes).toBe(DEFAULT_MAX_FILE_SIZE_BYTES);
  });

  it('should default maxSizeBytes when FILES_MAX_SIZE_BYTES is not a positive number', () => {
    process.env.FILES_MAX_SIZE_BYTES = '-5';

    const config = filesConfig();

    expect(config.maxSizeBytes).toBe(DEFAULT_MAX_FILE_SIZE_BYTES);
  });

  it('should default maxSizeBytes when FILES_MAX_SIZE_BYTES is not a number', () => {
    process.env.FILES_MAX_SIZE_BYTES = 'not-a-number';

    const config = filesConfig();

    expect(config.maxSizeBytes).toBe(DEFAULT_MAX_FILE_SIZE_BYTES);
  });

  it('should use FILES_MAX_SIZE_BYTES when set to a valid positive integer', () => {
    process.env.FILES_MAX_SIZE_BYTES = '5242880';

    const config = filesConfig();

    expect(config.maxSizeBytes).toBe(5242880);
  });

  it('should default allowedMimeTypes when FILES_ALLOWED_MIME_TYPES is unset', () => {
    const config = filesConfig();

    expect(config.allowedMimeTypes).toEqual(DEFAULT_ALLOWED_MIME_TYPES);
  });

  it('should default allowedMimeTypes when FILES_ALLOWED_MIME_TYPES is blank', () => {
    process.env.FILES_ALLOWED_MIME_TYPES = '  ,  ,';

    const config = filesConfig();

    expect(config.allowedMimeTypes).toEqual(DEFAULT_ALLOWED_MIME_TYPES);
  });

  it('should parse a comma-separated FILES_ALLOWED_MIME_TYPES, trimming entries', () => {
    process.env.FILES_ALLOWED_MIME_TYPES = 'image/png, image/jpeg ,image/gif';

    const config = filesConfig();

    expect(config.allowedMimeTypes).toEqual([
      'image/png',
      'image/jpeg',
      'image/gif',
    ]);
  });

  it('should default publicBaseUrl to an empty string when unset', () => {
    const config = filesConfig();

    expect(config.publicBaseUrl).toBe('');
  });

  it('should strip a trailing slash from FILES_PUBLIC_BASE_URL', () => {
    process.env.FILES_PUBLIC_BASE_URL = 'https://api.example.com/';

    const config = filesConfig();

    expect(config.publicBaseUrl).toBe('https://api.example.com');
  });

  it('should leave FILES_PUBLIC_BASE_URL untouched when it has no trailing slash', () => {
    process.env.FILES_PUBLIC_BASE_URL = 'https://api.example.com';

    const config = filesConfig();

    expect(config.publicBaseUrl).toBe('https://api.example.com');
  });
});
