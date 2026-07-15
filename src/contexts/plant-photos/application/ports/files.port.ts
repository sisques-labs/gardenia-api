import { UploadFilePortInput } from '@contexts/plant-photos/application/ports/upload-file-port.input';
import { UploadedFilePortResult } from '@contexts/plant-photos/application/ports/uploaded-file-port.result';

export const FILES_PORT = Symbol('FILES_PORT');

/**
 * Seam into the `files` bounded context. Implemented by an adapter that
 * dispatches `UploadFileCommand`/`DeleteFileCommand` via the global
 * `CommandBus` — no direct import of `files` domain/application from here.
 */
export interface IFilesPort {
  uploadFile(input: UploadFilePortInput): Promise<UploadedFilePortResult>;
  deleteFile(fileId: string): Promise<void>;
}
