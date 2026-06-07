import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import {
  ITaskHandler,
  ITaskQueueContext,
} from '@core/task-queue/interfaces/task-handler.interface';
import { TaskHandlerRegistry } from '@core/task-queue/registry/task-handler.registry';

@Injectable()
export class HarvestPlantTaskHandler implements ITaskHandler, OnModuleInit {
  readonly handlerKey = 'harvest-plant';
  private readonly logger = new Logger(HarvestPlantTaskHandler.name);

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
    this.logger.log(`Harvesting plant ${plantId} (job: ${ctx.jobId})`);
    await ctx.reportProgress(50);
    this.logger.log(`Plant ${plantId} harvested successfully`);
    await ctx.reportProgress(100);
  }
}
