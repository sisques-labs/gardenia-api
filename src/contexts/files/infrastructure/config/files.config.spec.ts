import { filesConfig } from './files.config';

describe('filesConfig', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.FILES_STORAGE_DRIVER;
    delete process.env.FILES_S3_BUCKET;
    delete process.env.FILES_S3_REGION;
    delete process.env.FILES_S3_ENDPOINT;
    delete process.env.FILES_S3_FORCE_PATH_STYLE;
    delete process.env.FILES_S3_ACCESS_KEY_ID;
    delete process.env.FILES_S3_SECRET_ACCESS_KEY;
    delete process.env.FILES_S3_KEY_PREFIX;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  function loadConfig() {
    return filesConfig();
  }

  it('defaults storageDriver to database when unset', () => {
    const config = loadConfig();
    expect(config.storageDriver).toBe('database');
  });

  it('falls back to database for an unrecognized driver value', () => {
    process.env.FILES_STORAGE_DRIVER = 'azure';
    const config = loadConfig();
    expect(config.storageDriver).toBe('database');
  });

  it('throws when s3 driver is selected and bucket is missing', () => {
    process.env.FILES_STORAGE_DRIVER = 's3';
    expect(() => loadConfig()).toThrow(
      'FILES_STORAGE_DRIVER=s3 requires FILES_S3_BUCKET to be set',
    );
  });

  it('does not throw when s3 driver is selected and bucket is set', () => {
    process.env.FILES_STORAGE_DRIVER = 's3';
    process.env.FILES_S3_BUCKET = 'my-bucket';
    expect(() => loadConfig()).not.toThrow();
  });

  it('does not throw when database driver is selected and no S3 env vars are set', () => {
    expect(() => loadConfig()).not.toThrow();
  });

  it('parses S3 env vars into the expected shape', () => {
    process.env.FILES_STORAGE_DRIVER = 's3';
    process.env.FILES_S3_BUCKET = 'my-bucket';
    process.env.FILES_S3_REGION = 'eu-west-1';
    process.env.FILES_S3_ENDPOINT = 'http://localhost:9000';
    process.env.FILES_S3_FORCE_PATH_STYLE = 'true';
    process.env.FILES_S3_ACCESS_KEY_ID = 'AKIA...';
    process.env.FILES_S3_SECRET_ACCESS_KEY = 'secret';
    process.env.FILES_S3_KEY_PREFIX = '/base/';

    const config = loadConfig();

    expect(config.s3).toEqual({
      bucket: 'my-bucket',
      region: 'eu-west-1',
      endpoint: 'http://localhost:9000',
      forcePathStyle: true,
      accessKeyId: 'AKIA...',
      secretAccessKey: 'secret',
      keyPrefix: 'base',
    });
  });

  it('defaults region to us-east-1 and leaves optional fields undefined', () => {
    const config = loadConfig();

    expect(config.s3).toEqual({
      bucket: '',
      region: 'us-east-1',
      endpoint: undefined,
      forcePathStyle: false,
      accessKeyId: undefined,
      secretAccessKey: undefined,
      keyPrefix: '',
    });
  });
});
