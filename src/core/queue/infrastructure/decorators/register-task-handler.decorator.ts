import { SetMetadata } from '@nestjs/common';

export const TASK_HANDLER_METADATA = Symbol('TASK_HANDLER_METADATA');

export const RegisterTaskHandler = (key: string) =>
  SetMetadata(TASK_HANDLER_METADATA, key);
