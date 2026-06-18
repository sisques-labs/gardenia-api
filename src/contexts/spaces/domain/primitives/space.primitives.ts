import { BasePrimitives } from '@sisques-labs/nestjs-kit';

import { SpaceEnvironmentEnum } from '../enums/space-environment.enum';

export type ISpacePrimitives = BasePrimitives & {
  name: string;
  ownerId: string;
  latitude: number | null;
  longitude: number | null;
  environment: SpaceEnvironmentEnum | null;
};
