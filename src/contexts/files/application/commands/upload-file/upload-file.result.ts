/**
 * Result of {@link UploadFileCommand}: the new file's id and its resolved
 * public-facing URL (as produced by the storage adapter).
 */
export interface UploadFileResult {
  id: string;
  url: string;
}
