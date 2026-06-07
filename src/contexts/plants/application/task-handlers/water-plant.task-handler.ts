import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { RegisterTaskHandler } from '@core/queue/infrastructure/decorators/register-task-handler.decorator';
import {
  ITaskHandler,
  ITaskQueueContext,
} from '@core/queue/application/ports/task-handler.port';

@Injectable()
@RegisterTaskHandler('water-plant')
export class WaterPlantTaskHandler implements ITaskHandler {
  readonly handlerKey = 'water-plant';
  private readonly logger = new Logger(WaterPlantTaskHandler.name);

  constructor(private readonly queryBus: QueryBus) {}

  async execute(
    payload: Record<string, unknown>,
    ctx: ITaskQueueContext,
  ): Promise<void> {
    const plantId = payload.plantId as string;
    this.logger.log(`Watering plant ${plantId} (job: ${ctx.jobId})`);

    await ctx.reportProgress(10);
    // await this.queryBus.execute(new PlantFindByIdQuery({ id: plantId }));
    await ctx.reportProgress(50);

    this.logger.log(`Plant ${plantId} watered successfully`);
    await ctx.reportProgress(100);
  }
}
