import { SaveFileContentInput } from '@contexts/files/application/ports/save-file-content.input';

export const FILE_STORAGE_PORT = Symbol('FILE_STORAGE_PORT');

/**
 * Storage backend abstraction for a file's raw bytes.
 *
 * This is the hexagonal seam that keeps the domain, application, and transport
 * layers ignorant of WHERE bytes live. `DatabaseFileStorageAdapter` persists
 * bytes in PostgreSQL; `S3FileStorageAdapter` persists them in S3-compatible
 * object storage. `files.module.ts` selects between them at DI time via a
 * `useFactory` binding of {@link FILE_STORAGE_PORT}, driven by the
 * `FILES_STORAGE_DRIVER` env var — no change to any other layer.
 *
 * The signature MUST stay free of any TypeORM / Postgres / vendor type.
 */
export interface IFileStoragePort {
  /** Persists the bytes under the given opaque storage key. */
  save(input: SaveFileContentInput): Promise<void>;
  /** Reads the bytes for the given key, or null if absent. */
  read(key: string): Promise<Buffer | null>;
  /** Removes the bytes for the given key. */
  delete(key: string): Promise<void>;
  /** Resolves the public-facing URL/locator for the given key. */
  resolveUrl(key: string): string;
}
