import { Injectable } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

import {
  ITaskHandler,
  ITaskQueueContext,
} from '@core/queue/interfaces/task-handler.interface';

export class TaskHandlerNotFoundException extends BaseException {
  constructor(handlerKey: string) {
    super(`No task handler registered for key '${handlerKey}'`);
  }
}

@Injectable()
export class TaskHandlerRegistry {
  private readonly handlers = new Map<string, ITaskHandler>();

  register(handler: ITaskHandler): void {
    this.handlers.set(handler.handlerKey, handler);
  }

  async dispatch(
    handlerKey: string,
    payload: Record<string, unknown>,
    ctx: ITaskQueueContext,
  ): Promise<void> {
    const handler = this.handlers.get(handlerKey);
    if (!handler) {
      throw new TaskHandlerNotFoundException(handlerKey);
    }
    await handler.execute(payload, ctx);
  }

  has(handlerKey: string): boolean {
    return this.handlers.has(handlerKey);
  }
}
