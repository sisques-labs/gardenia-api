import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import {
  ITaskHandler,
  ITaskQueueContext,
} from '@core/task-queue/interfaces/task-handler.interface';
import { TaskHandlerRegistry } from '@core/task-queue/registry/task-handler.registry';

@Injectable()
export class WaterPlantTaskHandler implements ITaskHandler, OnModuleInit {
  readonly handlerKey = 'water-plant';
  private readonly logger = new Logger(WaterPlantTaskHandler.name);

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
    this.logger.log(`Watering plant ${plantId} (job: ${ctx.jobId})`);

    await ctx.reportProgress(10);
    // Load plant via QueryBus to validate it exists
    // await this.queryBus.execute(new PlantFindByIdQuery({ id: plantId }));
    await ctx.reportProgress(50);

    // TODO: record watering action on the plant aggregate
    this.logger.log(`Plant ${plantId} watered successfully`);
    await ctx.reportProgress(100);
  }
}
