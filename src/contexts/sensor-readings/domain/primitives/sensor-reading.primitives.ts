import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type ISensorReadingPrimitives = BasePrimitives & {
  plantId: string;
  spaceId: string;
  metric: string;
  value: number;
  unit: string;
  measuredAt: Date;
  source: string;
};
