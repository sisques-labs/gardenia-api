import { ConfigType, registerAs } from '@nestjs/config';

export const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

/**
 * Configuration for the `files` context. All values are optional with sensible
 * defaults, so no environment changes are required to run the module.
 *
 * - `FILES_MAX_SIZE_BYTES` — max accepted upload size in bytes (default 10 MB).
 * - `FILES_ALLOWED_MIME_TYPES` — comma-separated MIME allowlist (image-only).
 * - `FILES_PUBLIC_BASE_URL` — optional absolute base prepended to resolved URLs
 *   (e.g. `https://api.example.com`). When empty, URLs are app-relative.
 */
export const filesConfig = registerAs('files', () => {
  const maxSizeBytes = Number.parseInt(
    process.env.FILES_MAX_SIZE_BYTES ?? '',
    10,
  );

  const allowedMimeTypes = process.env.FILES_ALLOWED_MIME_TYPES?.split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

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
  };
});

export type FilesConfig = ConfigType<typeof filesConfig>;
