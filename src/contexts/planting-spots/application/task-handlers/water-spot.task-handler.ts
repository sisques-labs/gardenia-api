import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { RegisterTaskHandler } from '@core/queue/decorators/register-task-handler.decorator';
import {
  ITaskHandler,
  ITaskQueueContext,
} from '@core/queue/interfaces/task-handler.interface';

@Injectable()
@RegisterTaskHandler('water-spot')
export class WaterSpotTaskHandler implements ITaskHandler {
  readonly handlerKey = 'water-spot';
  private readonly logger = new Logger(WaterSpotTaskHandler.name);

  constructor(private readonly queryBus: QueryBus) {}

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
