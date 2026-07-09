/**
 * Result of `IFilesPort.uploadFile()`: the new file's id and its resolved
 * public-facing URL, as produced by the `files` context's storage adapter.
 */
export interface UploadedFilePortResult {
  id: string;
  url: string;
}
