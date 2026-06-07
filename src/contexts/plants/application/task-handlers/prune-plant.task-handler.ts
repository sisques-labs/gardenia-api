import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import {
  ITaskHandler,
  ITaskQueueContext,
} from '@core/queue/interfaces/task-handler.interface';
import { TaskHandlerRegistry } from '@core/queue/registry/task-handler.registry';

@Injectable()
export class PrunePlantTaskHandler implements ITaskHandler, OnModuleInit {
  readonly handlerKey = 'prune-plant';
  private readonly logger = new Logger(PrunePlantTaskHandler.name);

  constructor(
    private readonly registry: TaskHandlerRegistry,
    private readonly queryBus: QueryBus,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async execute(
    payload: Record<string, unknown>,
    ctx: ITaskQueueContext,
  ): Promise<void> {
    const plantId = payload.plantId as string;
    this.logger.log(`Pruning plant ${plantId} (job: ${ctx.jobId})`);
    await ctx.reportProgress(50);
    this.logger.log(`Plant ${plantId} pruned successfully`);
    await ctx.reportProgress(100);
  }
}
