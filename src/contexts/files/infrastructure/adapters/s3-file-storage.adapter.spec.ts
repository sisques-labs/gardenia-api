import { S3Client } from '@aws-sdk/client-s3';

import { FilesConfig } from '@contexts/files/infrastructure/config/files.config';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { S3FileStorageAdapter } from './s3-file-storage.adapter';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const KEY = '550e8400-e29b-41d4-a716-446655440000';

function buildConfig(overrides: Partial<FilesConfig> = {}): FilesConfig {
  return {
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    publicBaseUrl: '',
    storageDriver: 's3',
    s3: {
      bucket: 'my-bucket',
      region: 'us-east-1',
      endpoint: undefined,
      forcePathStyle: false,
      accessKeyId: undefined,
      secretAccessKey: undefined,
      keyPrefix: '',
    },
    ...overrides,
  };
}

describe('S3FileStorageAdapter', () => {
  let adapter: S3FileStorageAdapter;
  let s3: { send: jest.Mock };
  const spaceContext = {
    require: () => SPACE_ID,
    get: () => SPACE_ID,
  } as unknown as SpaceContext;

  beforeEach(() => {
    s3 = { send: jest.fn() };
    adapter = new S3FileStorageAdapter(
      s3 as unknown as S3Client,
      spaceContext,
      buildConfig(),
    );
  });

  it('save() sends a PutObjectCommand with bucket/key/body/contentType', async () => {
    const bytes = Buffer.from('binary');
    await adapter.save({
      key: KEY,
      bytes,
      mimeType: 'image/png',
      spaceId: SPACE_ID,
    });

    expect(s3.send).toHaveBeenCalledTimes(1);
    const command = s3.send.mock.calls[0][0] as any;
    expect(command.input).toEqual({
      Bucket: 'my-bucket',
      Key: `${SPACE_ID}/${KEY}`,
      Body: bytes,
      ContentType: 'image/png',
    });
  });

  it('read() returns the object bytes as a Buffer on hit', async () => {
    s3.send.mockResolvedValueOnce({
      Body: {
        transformToByteArray: async () => new Uint8Array([1, 2, 3]),
      },
    } as any);

    const result = await adapter.read(KEY);

    expect(result).toEqual(Buffer.from([1, 2, 3]));
    const command = s3.send.mock.calls[0][0] as any;
    expect(command.input).toEqual({
      Bucket: 'my-bucket',
      Key: `${SPACE_ID}/${KEY}`,
    });
  });

  it('read() returns null when the key does not exist (NoSuchKey)', async () => {
    s3.send.mockRejectedValueOnce(
      Object.assign(new Error('missing'), { name: 'NoSuchKey' }),
    );

    expect(await adapter.read(KEY)).toBeNull();
  });

  it('read() returns null on a 404 metadata error', async () => {
    s3.send.mockRejectedValueOnce(
      Object.assign(new Error('missing'), {
        $metadata: { httpStatusCode: 404 },
      }),
    );

    expect(await adapter.read(KEY)).toBeNull();
  });

  it('read() rethrows any other S3 error', async () => {
    const error = Object.assign(new Error('access denied'), {
      name: 'AccessDenied',
    });
    s3.send.mockRejectedValueOnce(error);

    await expect(adapter.read(KEY)).rejects.toThrow('access denied');
  });

  it('delete() sends a DeleteObjectCommand and does not throw when already absent', async () => {
    s3.send.mockResolvedValueOnce({} as any);

    await expect(adapter.delete(KEY)).resolves.toBeUndefined();
    const command = s3.send.mock.calls[0][0] as any;
    expect(command.input).toEqual({
      Bucket: 'my-bucket',
      Key: `${SPACE_ID}/${KEY}`,
    });
  });

  it('resolveUrl() points to the download endpoint (app-relative by default)', () => {
    expect(adapter.resolveUrl(KEY)).toBe(`/api/files/${KEY}/content`);
  });

  it('resolveUrl() prepends the configured public base url', () => {
    adapter = new S3FileStorageAdapter(
      s3 as unknown as S3Client,
      spaceContext,
      buildConfig({ publicBaseUrl: 'https://api.example.com' }),
    );
    expect(adapter.resolveUrl(KEY)).toBe(
      `https://api.example.com/api/files/${KEY}/content`,
    );
  });

  it('buildKey() applies the configured keyPrefix when set', async () => {
    adapter = new S3FileStorageAdapter(
      s3 as unknown as S3Client,
      spaceContext,
      buildConfig({
        s3: {
          bucket: 'my-bucket',
          region: 'us-east-1',
          endpoint: undefined,
          forcePathStyle: false,
          accessKeyId: undefined,
          secretAccessKey: undefined,
          keyPrefix: 'base',
        },
      }),
    );
    s3.send.mockResolvedValueOnce({} as any);

    await adapter.delete(KEY);

    const command = s3.send.mock.calls[0][0] as any;
    expect(command.input.Key).toBe(`base/${SPACE_ID}/${KEY}`);
  });
});
