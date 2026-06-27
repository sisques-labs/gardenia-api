import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IFileStoragePort } from '@contexts/files/application/ports/file-storage.port';
import { SaveFileContentInput } from '@contexts/files/application/ports/save-file-content.input';
import {
  FilesConfig,
  filesConfig,
} from '@contexts/files/infrastructure/config/files.config';
import { FileContentTypeOrmEntity } from '@contexts/files/infrastructure/persistence/typeorm/entities/file-content.entity';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { createTenantRepository } from '@shared/tenant-repository/create-tenant-repository.factory';

/**
 * v1 storage adapter: persists file bytes in PostgreSQL (`file_contents.data`,
 * a `bytea` column) and resolves the public URL to the byte-serving endpoint.
 *
 * This is the ONLY class that touches raw byte storage. Replacing it with an
 * S3/MinIO adapter requires only implementing {@link IFileStoragePort} and
 * rebinding `FILE_STORAGE_PORT` via `useClass` — no other layer changes.
 */
@Injectable()
export class DatabaseFileStorageAdapter implements IFileStoragePort {
  private readonly logger = new Logger(DatabaseFileStorageAdapter.name);
  private readonly repository: Repository<FileContentTypeOrmEntity>;

  constructor(
    @InjectRepository(FileContentTypeOrmEntity)
    rawRepo: Repository<FileContentTypeOrmEntity>,
    private readonly spaceContext: SpaceContext,
    @Inject(filesConfig.KEY)
    private readonly config: FilesConfig,
  ) {
    this.repository = createTenantRepository(rawRepo, spaceContext);
  }

  async save(input: SaveFileContentInput): Promise<void> {
    this.logger.log(
      `Storing ${input.bytes.length} bytes for file ${input.key}`,
    );

    const entity = new FileContentTypeOrmEntity();
    entity.fileId = input.key;
    entity.spaceId = input.spaceId;
    entity.data = input.bytes;

    await this.repository.save(entity);

    this.logger.debug(`Bytes stored for file ${input.key}`);
  }

  async read(key: string): Promise<Buffer | null> {
    this.logger.log(`Reading bytes for file ${key}`);

    const entity = await this.repository.findOne({
      where: { fileId: key },
    });

    if (!entity) {
      this.logger.warn(`No bytes found for file ${key}`);
      return null;
    }

    return entity.data;
  }

  async delete(key: string): Promise<void> {
    this.logger.log(`Deleting bytes for file ${key}`);
    await this.repository.delete({ fileId: key });
  }

  resolveUrl(key: string): string {
    return `${this.config.publicBaseUrl}/api/files/${key}/content`;
  }
}
