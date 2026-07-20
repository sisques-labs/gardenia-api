import { UploadFilePortInput } from '@contexts/plant-identification/application/ports/upload-file-port.input';
import { UploadedFilePortResult } from '@contexts/plant-identification/application/ports/uploaded-file-port.result';

export const FILES_PORT = Symbol('FILES_PORT');

/**
 * Seam into the `files` bounded context. Implemented by an adapter that
 * dispatches `UploadFileCommand` via the global `CommandBus` — no direct
 * import of `files` domain/application from here. Mirrors `plant-photos`'
 * own `IFilesPort`.
 */
export interface IFilesPort {
  uploadFile(input: UploadFilePortInput): Promise<UploadedFilePortResult>;
}
