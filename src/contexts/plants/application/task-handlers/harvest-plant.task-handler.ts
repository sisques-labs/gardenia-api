import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { RegisterTaskHandler } from '@core/queue/infrastructure/decorators/register-task-handler.decorator';
import {
  ITaskHandler,
  ITaskQueueContext,
} from '@core/queue/application/ports/task-handler.port';

@Injectable()
@RegisterTaskHandler('harvest-plant')
export class HarvestPlantTaskHandler implements ITaskHandler {
  readonly handlerKey = 'harvest-plant';
  private readonly logger = new Logger(HarvestPlantTaskHandler.name);

  constructor(private readonly queryBus: QueryBus) {}

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
