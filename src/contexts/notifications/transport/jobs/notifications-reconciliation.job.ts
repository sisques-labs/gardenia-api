import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import { Cron } from '@nestjs/schedule';

import {
  SPACE_DIRECTORY_PORT,
  ISpaceDirectoryPort,
} from '@contexts/notifications/application/ports/space-directory.port';
import { ReconcileSpaceNotificationsCommand } from '@contexts/notifications/application/commands/reconcile-space-notifications/reconcile-space-notifications.command';
import { INotificationsConfig } from '@core/config/notifications.config';
import { SpaceContext } from '@shared/space-context/space-context.service';

const RECONCILE_CRON =
  process.env.NOTIFICATIONS_RECONCILE_CRON?.trim() || '*/15 * * * *';

/**
 * Sweeps every space on a fixed interval, dispatching
 * ReconcileSpaceNotificationsCommand within that space's SpaceContext. One
 * space's failure is logged and skipped — it must not abort the sweep for
 * other spaces (best-effort, mirrors the Kafka forwarder's philosophy).
 *
 * Guarded by NOTIFICATIONS_RECONCILE_ENABLED (default true), read at each
 * tick rather than once at bootstrap so it can be toggled without a
 * restart — mirrors the KAFKA_ENABLED opt-in pattern.
 */
@Injectable()
export class NotificationsReconciliationJob {
  private readonly logger = new Logger(NotificationsReconciliationJob.name);
  private running = false;

  constructor(
    @Inject(SPACE_DIRECTORY_PORT)
    private readonly spaceDirectoryPort: ISpaceDirectoryPort,
    private readonly commandBus: CommandBus,
    private readonly spaceContext: SpaceContext,
    private readonly configService: ConfigService,
  ) {}

  @Cron(RECONCILE_CRON, { name: 'notifications-reconciliation' })
  async run(): Promise<void> {
    const config =
      this.configService.getOrThrow<INotificationsConfig>('notifications');

    if (!config.reconcileEnabled) {
      this.logger.debug(
        'Notifications reconciliation disabled (NOTIFICATIONS_RECONCILE_ENABLED=false) — skipping tick',
      );
      return;
    }

    if (this.running) {
      this.logger.warn(
        'Previous reconciliation sweep still running — skipping this tick',
      );
      return;
    }
    this.running = true;

    try {
      const spaceIds = await this.spaceDirectoryPort.listAllSpaceIds();
      this.logger.log(
        `Starting reconciliation sweep across ${spaceIds.length} space(s)`,
      );

      let succeeded = 0;
      for (const spaceId of spaceIds) {
        try {
          await this.spaceContext.run(spaceId, () =>
            this.commandBus.execute(
              new ReconcileSpaceNotificationsCommand({
                careScheduleDueWindowHours: config.careScheduleDueWindowHours,
                inventoryExpiringWindowDays: config.inventoryExpiringWindowDays,
              }),
            ),
          );
          succeeded += 1;
        } catch (error) {
          this.logger.error(
            `Reconciliation failed for space ${spaceId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }

      this.logger.log(
        `Reconciliation sweep complete: ${succeeded}/${spaceIds.length} space(s) succeeded`,
      );
    } finally {
      this.running = false;
    }
  }
}
