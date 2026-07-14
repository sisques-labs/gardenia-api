import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import { Cron } from '@nestjs/schedule';

import {
  SPACE_DIRECTORY_PORT,
  ISpaceDirectoryPort,
} from '@contexts/inventory/application/ports/space-directory.port';
import { CheckExpiringInventoryItemsCommand } from '@contexts/inventory/application/commands/check-expiring-inventory-items/check-expiring-inventory-items.command';
import { IInventoryConfig } from '@core/config/inventory.config';
import { SpaceContext } from '@shared/space-context/space-context.service';

const EXPIRING_RECONCILE_CRON =
  process.env.INVENTORY_EXPIRING_RECONCILE_CRON?.trim() || '*/15 * * * *';

/**
 * Sweeps every space on a fixed interval, detecting newly-expiring inventory
 * items and telling notifications about them. One space's failure is logged
 * and skipped — it must not abort the sweep for other spaces. Resolving an
 * item that's no longer expiring is event-driven (see update/delete-
 * inventory-item handlers), not part of this sweep. Low-stock has no
 * equivalent cron — it's fully event-driven both ways.
 */
@Injectable()
export class InventoryExpiringReconciliationJob {
  private readonly logger = new Logger(InventoryExpiringReconciliationJob.name);
  private running = false;

  constructor(
    @Inject(SPACE_DIRECTORY_PORT)
    private readonly spaceDirectoryPort: ISpaceDirectoryPort,
    private readonly commandBus: CommandBus,
    private readonly spaceContext: SpaceContext,
    private readonly configService: ConfigService,
  ) {}

  @Cron(EXPIRING_RECONCILE_CRON, { name: 'inventory-expiring-reconciliation' })
  async run(): Promise<void> {
    if (this.running) {
      this.logger.warn(
        'Previous expiring-reconciliation sweep still running — skipping this tick',
      );
      return;
    }
    this.running = true;

    try {
      const config =
        this.configService.getOrThrow<IInventoryConfig>('inventory');
      const spaceIds = await this.spaceDirectoryPort.listAllSpaceIds();
      this.logger.log(
        `Starting expiring-reconciliation sweep across ${spaceIds.length} space(s)`,
      );

      let succeeded = 0;
      for (const spaceId of spaceIds) {
        try {
          await this.spaceContext.run(spaceId, () =>
            this.commandBus.execute(
              new CheckExpiringInventoryItemsCommand({
                windowDays: config.expiringWindowDays,
              }),
            ),
          );
          succeeded += 1;
        } catch (error) {
          this.logger.error(
            `Expiring-reconciliation failed for space ${spaceId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }

      this.logger.log(
        `Expiring-reconciliation sweep complete: ${succeeded}/${spaceIds.length} space(s) succeeded`,
      );
    } finally {
      this.running = false;
    }
  }
}
