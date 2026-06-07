import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { RegisterTaskHandler } from '@core/queue/decorators/register-task-handler.decorator';
import {
  ITaskHandler,
  ITaskQueueContext,
} from '@core/queue/interfaces/task-handler.interface';

@Injectable()
@RegisterTaskHandler('plant-seedling')
export class PlantSeedlingTaskHandler implements ITaskHandler {
  readonly handlerKey = 'plant-seedling';
  private readonly logger = new Logger(PlantSeedlingTaskHandler.name);

  constructor(private readonly queryBus: QueryBus) {}

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
