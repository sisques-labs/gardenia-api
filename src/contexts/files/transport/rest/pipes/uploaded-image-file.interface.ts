/**
 * Minimal shape of a Multer-parsed upload (memory storage). Declared locally so
 * the module does not depend on `@types/multer` for a single field type.
 */
export interface UploadedImageFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
