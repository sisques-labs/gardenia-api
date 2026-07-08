export interface UploadFilePortInput {
  filename: string;
  mimeType: string;
  size: number;
  content: Buffer;
  userId: string;
  spaceId: string;
}
