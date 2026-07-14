import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import { Cron } from '@nestjs/schedule';

import {
  SPACE_DIRECTORY_PORT,
  ISpaceDirectoryPort,
} from '@contexts/care-schedule/application/ports/space-directory.port';
import { CheckDueCareSchedulesCommand } from '@contexts/care-schedule/application/commands/check-due-care-schedules/check-due-care-schedules.command';
import { ICareScheduleConfig } from '@core/config/care-schedule.config';
import { SpaceContext } from '@shared/space-context/space-context.service';

const DUE_RECONCILE_CRON =
  process.env.CARE_SCHEDULE_DUE_RECONCILE_CRON?.trim() || '*/15 * * * *';

/**
 * Sweeps every space on a fixed interval, detecting newly-due care schedules
 * and telling notifications about them. One space's failure is logged and
 * skipped — it must not abort the sweep for other spaces. Resolving a
 * schedule that's no longer due is event-driven (see complete/update/delete
 * care-schedule handlers), not part of this sweep.
 */
@Injectable()
export class CareScheduleDueReconciliationJob {
  private readonly logger = new Logger(CareScheduleDueReconciliationJob.name);
  private running = false;

  constructor(
    @Inject(SPACE_DIRECTORY_PORT)
    private readonly spaceDirectoryPort: ISpaceDirectoryPort,
    private readonly commandBus: CommandBus,
    private readonly spaceContext: SpaceContext,
    private readonly configService: ConfigService,
  ) {}

  @Cron(DUE_RECONCILE_CRON, { name: 'care-schedule-due-reconciliation' })
  async run(): Promise<void> {
    if (this.running) {
      this.logger.warn(
        'Previous due-reconciliation sweep still running — skipping this tick',
      );
      return;
    }
    this.running = true;

    try {
      const config =
        this.configService.getOrThrow<ICareScheduleConfig>('careSchedule');
      const spaceIds = await this.spaceDirectoryPort.listAllSpaceIds();
      this.logger.log(
        `Starting due-reconciliation sweep across ${spaceIds.length} space(s)`,
      );

      let succeeded = 0;
      for (const spaceId of spaceIds) {
        try {
          await this.spaceContext.run(spaceId, () =>
            this.commandBus.execute(
              new CheckDueCareSchedulesCommand({
                windowHours: config.dueWindowHours,
              }),
            ),
          );
          succeeded += 1;
        } catch (error) {
          this.logger.error(
            `Due-reconciliation failed for space ${spaceId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }

      this.logger.log(
        `Due-reconciliation sweep complete: ${succeeded}/${spaceIds.length} space(s) succeeded`,
      );
    } finally {
      this.running = false;
    }
  }
}
