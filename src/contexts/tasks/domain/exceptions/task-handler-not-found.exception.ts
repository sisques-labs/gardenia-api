import { BaseException } from '@sisques-labs/nestjs-kit';

export class TaskHandlerNotFoundException extends BaseException {
  constructor(handlerKey: string) {
    super(`No task handler registered for key '${handlerKey}'`);
  }
}
