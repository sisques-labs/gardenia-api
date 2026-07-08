/**
 * Minimal shape of a Multer-parsed upload (memory storage). Declared locally,
 * same reasoning as `files/transport/rest/pipes/uploaded-image-file.interface.ts`:
 * avoids a `@types/multer` dependency for a single field type.
 */
export interface UploadedPhotoFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
