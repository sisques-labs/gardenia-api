/**
 * Result of {@link FileFindContentByIdQuery}: the file's raw bytes plus the
 * metadata the content-serving endpoint needs to set response headers.
 */
export interface FileContentResult {
  bytes: Buffer;
  mimeType: string;
  filename: string;
}
