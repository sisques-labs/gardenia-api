import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CreateCareLogEntryCommand } from '@contexts/care-log/application/commands/create-care-log-entry/create-care-log-entry.command';
import { IHaWritePort } from '@contexts/home-assistant/application/ports/ha-write.port';
import { AdjustInventoryItemQuantityCommand } from '@contexts/inventory/application/commands/adjust-inventory-item-quantity/adjust-inventory-item-quantity.command';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';
import { SpaceFindByIdQuery } from '@contexts/spaces/application/queries/space-find-by-id/space-find-by-id.query';

const HA_REASON = 'Home Assistant';

/**
 * Turns Home Assistant commands into Gardenia commands via the Command bus.
 * Care-log/harvest writes need an acting user, which HA does not provide, so
 * they are attributed to the space owner (resolved through the Query bus).
 */
@Injectable()
export class HaWriteAdapter implements IHaWritePort {
  private readonly logger = new Logger(HaWriteAdapter.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async recordWatering(spaceId: string, plantId: string): Promise<void> {
    const ownerId = await this.resolveOwner(spaceId);
    this.logger.log(
      `Recording watering for plant ${plantId} (space ${spaceId})`,
    );

    await this.commandBus.execute(
      new CreateCareLogEntryCommand({
        plantId,
        userId: ownerId,
        spaceId,
        activityType: CareLogActivityTypeEnum.WATERING,
      }),
    );
  }

  async adjustInventory(
    spaceId: string,
    itemId: string,
    delta: number,
  ): Promise<void> {
    this.logger.log(
      `Adjusting inventory ${itemId} by ${delta} (space ${spaceId})`,
    );

    await this.commandBus.execute(
      new AdjustInventoryItemQuantityCommand({
        id: itemId,
        delta,
        reason: HA_REASON,
      }),
    );
  }

  private async resolveOwner(spaceId: string): Promise<string> {
    const space = await this.queryBus.execute<
      SpaceFindByIdQuery,
      SpaceViewModel | null
    >(new SpaceFindByIdQuery({ spaceId }));

    if (!space) {
      throw new Error(`Space ${spaceId} not found`);
    }
    return space.ownerId;
  }
}
