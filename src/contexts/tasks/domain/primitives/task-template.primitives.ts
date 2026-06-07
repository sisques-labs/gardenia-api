import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export interface ITaskTemplatePrimitives extends BasePrimitives {
  id: string;
  name: string;
  description: string | null;
  handlerKey: string;
  defaultPriority: number;
  defaultRetryCount: number;
  defaultBackoffStrategy: string;
  defaultTimeoutMs: number;
  maxConcurrency: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
