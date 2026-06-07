import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { RegisterTaskHandler } from '@core/queue/infrastructure/decorators/register-task-handler.decorator';
import {
  ITaskHandler,
  ITaskQueueContext,
} from '@core/queue/application/ports/task-handler.port';

@Injectable()
@RegisterTaskHandler('prepare-winter')
export class PrepareWinterTaskHandler implements ITaskHandler {
  readonly handlerKey = 'prepare-winter';
  private readonly logger = new Logger(PrepareWinterTaskHandler.name);

  constructor(private readonly queryBus: QueryBus) {}

  async execute(
    payload: Record<string, unknown>,
    ctx: ITaskQueueContext,
  ): Promise<void> {
    const plantingSpotId = payload.plantingSpotId as string;
    this.logger.log(
      `Preparing spot ${plantingSpotId} for winter (job: ${ctx.jobId})`,
    );
    await ctx.reportProgress(50);
    this.logger.log(`Spot ${plantingSpotId} prepared for winter`);
    await ctx.reportProgress(100);
  }
}
