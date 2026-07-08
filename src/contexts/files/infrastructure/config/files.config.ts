import { ConfigType, registerAs } from '@nestjs/config';

export const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export type FilesStorageDriver = 'database' | 's3';
export const DEFAULT_FILES_STORAGE_DRIVER: FilesStorageDriver = 'database';
export const DEFAULT_FILES_S3_REGION = 'us-east-1';

/**
 * Configuration for the `files` context. All values are optional with sensible
 * defaults, so no environment changes are required to run the module.
 *
 * - `FILES_MAX_SIZE_BYTES` — max accepted upload size in bytes (default 10 MB).
 * - `FILES_ALLOWED_MIME_TYPES` — comma-separated MIME allowlist (image-only).
 * - `FILES_PUBLIC_BASE_URL` — optional absolute base prepended to resolved URLs
 *   (e.g. `https://api.example.com`). When empty, URLs are app-relative.
 * - `FILES_STORAGE_DRIVER` — `database` (default) or `s3`. Unrecognized values
 *   safely fall back to `database`.
 * - `FILES_S3_*` — S3 backend settings, only validated/required when the `s3`
 *   driver is selected (see below).
 */
export const filesConfig = registerAs('files', () => {
  const maxSizeBytes = Number.parseInt(
    process.env.FILES_MAX_SIZE_BYTES ?? '',
    10,
  );

  const allowedMimeTypes = process.env.FILES_ALLOWED_MIME_TYPES?.split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const rawDriver = (process.env.FILES_STORAGE_DRIVER ?? '').toLowerCase();
  const storageDriver: FilesStorageDriver =
    rawDriver === 's3' ? 's3' : DEFAULT_FILES_STORAGE_DRIVER;

  const s3 = {
    bucket: process.env.FILES_S3_BUCKET ?? '',
    region: process.env.FILES_S3_REGION ?? DEFAULT_FILES_S3_REGION,
    endpoint: process.env.FILES_S3_ENDPOINT || undefined,
    forcePathStyle: process.env.FILES_S3_FORCE_PATH_STYLE === 'true',
    accessKeyId: process.env.FILES_S3_ACCESS_KEY_ID || undefined,
    secretAccessKey: process.env.FILES_S3_SECRET_ACCESS_KEY || undefined,
    keyPrefix: (process.env.FILES_S3_KEY_PREFIX ?? '').replace(
      /^\/+|\/+$/g,
      '',
    ),
  };

  // Fail fast at bootstrap: the s3 driver requires a bucket. Missing S3 env
  // vars MUST NOT fail when the database driver is active.
  if (storageDriver === 's3' && !s3.bucket) {
    throw new Error(
      'FILES_STORAGE_DRIVER=s3 requires FILES_S3_BUCKET to be set',
    );
  }

  return {
    maxSizeBytes:
      Number.isFinite(maxSizeBytes) && maxSizeBytes > 0
        ? maxSizeBytes
        : DEFAULT_MAX_FILE_SIZE_BYTES,
    allowedMimeTypes:
      allowedMimeTypes && allowedMimeTypes.length > 0
        ? allowedMimeTypes
        : DEFAULT_ALLOWED_MIME_TYPES,
    publicBaseUrl: (process.env.FILES_PUBLIC_BASE_URL ?? '').replace(/\/$/, ''),
    storageDriver,
    s3,
  };
});

export type FilesConfig = ConfigType<typeof filesConfig>;
