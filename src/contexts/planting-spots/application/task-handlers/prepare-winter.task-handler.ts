import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import {
  ITaskHandler,
  ITaskQueueContext,
} from '@core/task-queue/interfaces/task-handler.interface';
import { TaskHandlerRegistry } from '@core/task-queue/registry/task-handler.registry';

@Injectable()
export class PrepareWinterTaskHandler implements ITaskHandler, OnModuleInit {
  readonly handlerKey = 'prepare-winter';
  private readonly logger = new Logger(PrepareWinterTaskHandler.name);

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
    const plantingSpotId = payload.plantingSpotId as string;
    this.logger.log(`Preparing spot ${plantingSpotId} for winter (job: ${ctx.jobId})`);
    await ctx.reportProgress(50);
    this.logger.log(`Spot ${plantingSpotId} prepared for winter`);
    await ctx.reportProgress(100);
  }
}
