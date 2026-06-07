import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DiscoveryService } from '@nestjs/core';
import { BaseException } from '@sisques-labs/nestjs-kit';

import { TASK_HANDLER_METADATA } from '@core/queue/decorators/register-task-handler.decorator';
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
export class TaskHandlerRegistry implements OnApplicationBootstrap {
  private readonly handlers = new Map<string, ITaskHandler>();
  private readonly logger = new Logger(TaskHandlerRegistry.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  onApplicationBootstrap(): void {
    const providers = this.discoveryService.getProviders();
    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || typeof instance !== 'object') continue;
      const key = this.reflector.get<string | undefined>(
        TASK_HANDLER_METADATA,
        instance.constructor,
      );
      if (key) {
        this.handlers.set(key, instance as ITaskHandler);
        this.logger.log(`Registered task handler: '${key}'`);
      }
    }
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
