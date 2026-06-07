import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import {
  ITaskHandler,
  ITaskQueueContext,
} from '@core/task-queue/interfaces/task-handler.interface';
import { TaskHandlerRegistry } from '@core/task-queue/registry/task-handler.registry';

@Injectable()
export class PlantSeedlingTaskHandler implements ITaskHandler, OnModuleInit {
  readonly handlerKey = 'plant-seedling';
  private readonly logger = new Logger(PlantSeedlingTaskHandler.name);

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
    const seedlingType = payload.seedlingType as string | undefined;
    this.logger.log(
      `Planting seedling ${seedlingType ?? 'unknown'} in spot ${plantingSpotId} (job: ${ctx.jobId})`,
    );
    await ctx.reportProgress(50);
    this.logger.log(`Seedling planted in spot ${plantingSpotId}`);
    await ctx.reportProgress(100);
  }
}
