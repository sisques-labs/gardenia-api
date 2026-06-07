import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import {
  ITaskHandler,
  ITaskQueueContext,
} from '@core/task-queue/interfaces/task-handler.interface';
import { TaskHandlerRegistry } from '@core/task-queue/registry/task-handler.registry';

@Injectable()
export class WaterSpotTaskHandler implements ITaskHandler, OnModuleInit {
  readonly handlerKey = 'water-spot';
  private readonly logger = new Logger(WaterSpotTaskHandler.name);

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
    this.logger.log(`Watering planting spot ${plantingSpotId} (job: ${ctx.jobId})`);
    await ctx.reportProgress(50);
    this.logger.log(`Planting spot ${plantingSpotId} watered successfully`);
    await ctx.reportProgress(100);
  }
}
