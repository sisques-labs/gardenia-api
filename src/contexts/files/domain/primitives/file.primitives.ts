import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IFilePrimitives = BasePrimitives & {
  filename: string;
  mimeType: string;
  size: number;
  storageKey: string;
  url: string;
  userId: string;
  spaceId: string;
};
