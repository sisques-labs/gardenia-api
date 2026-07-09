import { Provider } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';

import {
  FilesConfig,
  filesConfig,
} from '@contexts/files/infrastructure/config/files.config';

/**
 * DI token for the shared, singleton `S3Client` instance used by
 * {@link S3FileStorageAdapter}. Built once at module init from `filesConfig`;
 * the client opens no connection until `send()` is invoked, so its idle cost
 * is nil even when the `database` driver is active.
 */
export const S3_CLIENT = Symbol('S3_CLIENT');

export const s3ClientProvider: Provider = {
  provide: S3_CLIENT,
  inject: [filesConfig.KEY],
  useFactory: (config: FilesConfig): S3Client =>
    new S3Client({
      region: config.s3.region,
      ...(config.s3.endpoint ? { endpoint: config.s3.endpoint } : {}),
      forcePathStyle: config.s3.forcePathStyle,
      ...(config.s3.accessKeyId && config.s3.secretAccessKey
        ? {
            credentials: {
              accessKeyId: config.s3.accessKeyId,
              secretAccessKey: config.s3.secretAccessKey,
            },
          }
        : {}), // else: SDK default credential provider chain (IAM role, etc.)
    }),
};
