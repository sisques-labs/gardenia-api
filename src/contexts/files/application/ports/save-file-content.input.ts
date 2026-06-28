/**
 * Payload handed to the storage port when persisting a file's bytes. Carries the
 * opaque storage key, the raw bytes, the MIME type (some backends store it
 * alongside the object), and the tenant scope.
 */
export interface SaveFileContentInput {
  key: string;
  bytes: Buffer;
  mimeType: string;
  spaceId: string;
}
