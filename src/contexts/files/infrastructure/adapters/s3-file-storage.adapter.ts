import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { IFileStoragePort } from '@contexts/files/application/ports/file-storage.port';
import { SaveFileContentInput } from '@contexts/files/application/ports/save-file-content.input';
import {
  FilesConfig,
  filesConfig,
} from '@contexts/files/infrastructure/config/files.config';
import { S3_CLIENT } from '@contexts/files/infrastructure/config/s3-client.provider';
import { SpaceContext } from '@shared/space-context/space-context.service';

/**
 * S3-backed storage adapter: persists file bytes in an S3-compatible bucket
 * (AWS S3, MinIO, LocalStack) via `@aws-sdk/client-s3`, and resolves the
 * public URL to the app's own byte-serving endpoint (never a presigned or
 * public bucket URL — see design notes on `resolveUrl`).
 *
 * This is the ONLY class that translates `IFileStoragePort` calls into AWS S3
 * SDK operations. No `@aws-sdk/client-s3` type crosses the port boundary.
 */
@Injectable()
export class S3FileStorageAdapter implements IFileStoragePort {
  private readonly logger = new Logger(S3FileStorageAdapter.name);

  constructor(
    @Inject(S3_CLIENT) private readonly s3: S3Client,
    private readonly spaceContext: SpaceContext,
    @Inject(filesConfig.KEY) private readonly config: FilesConfig,
  ) {}

  async save(input: SaveFileContentInput): Promise<void> {
    const Key = this.buildKey(input.spaceId, input.key);
    this.logger.log(
      `Storing ${input.bytes.length} bytes at s3://${this.config.s3.bucket}/${Key}`,
    );

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.config.s3.bucket,
        Key,
        Body: input.bytes,
        ContentType: input.mimeType,
      }),
    );

    this.logger.debug(`Bytes stored for file ${input.key}`);
  }

  async read(key: string): Promise<Buffer | null> {
    const Key = this.buildKey(this.spaceContext.require(), key);
    this.logger.log(`Reading bytes for file ${key}`);

    try {
      const res = await this.s3.send(
        new GetObjectCommand({ Bucket: this.config.s3.bucket, Key }),
      );

      if (!res.Body) {
        this.logger.warn(`No bytes found for file ${key}`);
        return null;
      }

      return Buffer.from(await res.Body.transformToByteArray());
    } catch (err) {
      if (this.isNotFound(err)) {
        this.logger.warn(`No bytes found for file ${key}`);
        return null;
      }

      throw err; // AccessDenied / network / misconfig → surfaces as 500
    }
  }

  async delete(key: string): Promise<void> {
    const Key = this.buildKey(this.spaceContext.require(), key);
    this.logger.log(`Deleting bytes for file ${key}`);

    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.config.s3.bucket, Key }),
    ); // idempotent — S3 does not throw when the key is already absent
  }

  resolveUrl(key: string): string {
    return `${this.config.publicBaseUrl}/api/files/${key}/content`;
  }

  private buildKey(spaceId: string, fileId: string): string {
    const prefix = this.config.s3.keyPrefix
      ? `${this.config.s3.keyPrefix}/`
      : '';
    return `${prefix}${spaceId}/${fileId}`;
  }

  private isNotFound(err: unknown): boolean {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    return e?.name === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404;
  }
}
