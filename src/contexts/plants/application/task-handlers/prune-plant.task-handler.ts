import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { RegisterTaskHandler } from '@core/queue/infrastructure/decorators/register-task-handler.decorator';
import {
  ITaskHandler,
  ITaskQueueContext,
} from '@core/queue/application/ports/task-handler.port';

@Injectable()
@RegisterTaskHandler('prune-plant')
export class PrunePlantTaskHandler implements ITaskHandler {
  readonly handlerKey = 'prune-plant';
  private readonly logger = new Logger(PrunePlantTaskHandler.name);

  constructor(private readonly queryBus: QueryBus) {}

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
