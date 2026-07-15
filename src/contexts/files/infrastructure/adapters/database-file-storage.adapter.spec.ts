import { Repository } from 'typeorm';

import { FilesConfig } from '@contexts/files/infrastructure/config/files.config';
import { FileContentTypeOrmEntity } from '@contexts/files/infrastructure/persistence/typeorm/entities/file-content.entity';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { DatabaseFileStorageAdapter } from './database-file-storage.adapter';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const KEY = '550e8400-e29b-41d4-a716-446655440000';

function buildConfig(overrides: Partial<FilesConfig> = {}): FilesConfig {
  return {
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    publicBaseUrl: '',
    storageDriver: 'database',
    s3: {
      bucket: '',
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

describe('DatabaseFileStorageAdapter', () => {
  let adapter: DatabaseFileStorageAdapter;
  let rawRepo: jest.Mocked<Repository<FileContentTypeOrmEntity>>;
  const spaceContext = {
    require: () => SPACE_ID,
    get: () => SPACE_ID,
  } as unknown as SpaceContext;

  beforeEach(() => {
    rawRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Repository<FileContentTypeOrmEntity>>;
    adapter = new DatabaseFileStorageAdapter(
      rawRepo,
      spaceContext,
      buildConfig(),
    );
  });

  it('save() persists the bytes keyed by the storage key', async () => {
    const bytes = Buffer.from('binary');
    await adapter.save({
      key: KEY,
      bytes,
      mimeType: 'image/png',
      spaceId: SPACE_ID,
    });

    expect(rawRepo.save).toHaveBeenCalledTimes(1);
    const saved = rawRepo.save.mock.calls[0][0] as FileContentTypeOrmEntity;
    expect(saved.fileId).toBe(KEY);
    expect(saved.data.toString()).toBe('binary');
    expect(saved.spaceId).toBe(SPACE_ID);
  });

  it('read() returns the stored bytes, or null when absent', async () => {
    rawRepo.findOne.mockResolvedValueOnce({
      fileId: KEY,
      spaceId: SPACE_ID,
      data: Buffer.from('binary'),
    } as FileContentTypeOrmEntity);
    expect((await adapter.read(KEY))?.toString()).toBe('binary');

    rawRepo.findOne.mockResolvedValueOnce(null);
    expect(await adapter.read(KEY)).toBeNull();
  });

  it('delete() removes the bytes for the key', async () => {
    await adapter.delete(KEY);
    expect(rawRepo.delete).toHaveBeenCalledWith(
      expect.objectContaining({ fileId: KEY }),
    );
  });

  it('resolveUrl() points to the download endpoint (app-relative by default)', () => {
    expect(adapter.resolveUrl(KEY)).toBe(`/api/files/${KEY}/content`);
  });

  it('resolveUrl() prepends the configured public base url', () => {
    adapter = new DatabaseFileStorageAdapter(
      rawRepo,
      spaceContext,
      buildConfig({ publicBaseUrl: 'https://api.example.com' }),
    );
    expect(adapter.resolveUrl(KEY)).toBe(
      `https://api.example.com/api/files/${KEY}/content`,
    );
  });
});
