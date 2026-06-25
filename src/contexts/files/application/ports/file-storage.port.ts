import { SaveFileContentInput } from '@contexts/files/application/ports/save-file-content.input';

export const FILE_STORAGE_PORT = Symbol('FILE_STORAGE_PORT');

/**
 * Storage backend abstraction for a file's raw bytes.
 *
 * This is the hexagonal seam that keeps the domain, application, and transport
 * layers ignorant of WHERE bytes live. The v1 adapter persists them in
 * PostgreSQL; a future S3/MinIO adapter implements the same contract and is
 * swapped in via a `useClass` rebinding of {@link FILE_STORAGE_PORT}, with no
 * change to any other layer.
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
