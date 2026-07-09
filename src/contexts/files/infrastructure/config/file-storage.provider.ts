import { Provider } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Client } from '@aws-sdk/client-s3';

import { FILE_STORAGE_PORT } from '@contexts/files/application/ports/file-storage.port';
import { DatabaseFileStorageAdapter } from '@contexts/files/infrastructure/adapters/database-file-storage.adapter';
import { S3FileStorageAdapter } from '@contexts/files/infrastructure/adapters/s3-file-storage.adapter';
import {
  FilesConfig,
  filesConfig,
} from '@contexts/files/infrastructure/config/files.config';
import { S3_CLIENT } from '@contexts/files/infrastructure/config/s3-client.provider';
import { FileContentTypeOrmEntity } from '@contexts/files/infrastructure/persistence/typeorm/entities/file-content.entity';
import { SpaceContext } from '@shared/space-context/space-context.service';

/**
 * Selects the `IFileStoragePort` implementation at DI time based on
 * `FilesConfig.storageDriver` (`FILES_STORAGE_DRIVER` env var).
 */
export const fileStorageProvider: Provider = {
  provide: FILE_STORAGE_PORT,
  inject: [
    filesConfig.KEY,
    getRepositoryToken(FileContentTypeOrmEntity),
    SpaceContext,
    S3_CLIENT,
  ],
  useFactory: (
    config: FilesConfig,
    contentRepo: Repository<FileContentTypeOrmEntity>,
    spaceContext: SpaceContext,
    s3Client: S3Client,
  ) =>
    config.storageDriver === 's3'
      ? new S3FileStorageAdapter(s3Client, spaceContext, config)
      : new DatabaseFileStorageAdapter(contentRepo, spaceContext, config),
};
