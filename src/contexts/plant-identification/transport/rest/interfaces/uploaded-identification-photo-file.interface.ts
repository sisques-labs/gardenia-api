/**
 * Minimal shape of a Multer-parsed upload (memory storage). Declared locally,
 * same reasoning as `plant-photos/transport/rest/interfaces/uploaded-photo-
 * file.interface.ts`: avoids a `@types/multer` dependency for a single field
 * type.
 */
export interface UploadedIdentificationPhotoFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
