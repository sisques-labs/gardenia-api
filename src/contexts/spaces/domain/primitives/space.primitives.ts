import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type ISpacePrimitives = BasePrimitives & {
  name: string;
  ownerId: string;
  latitude: number | null;
  longitude: number | null;
  environment: string | null;
};
