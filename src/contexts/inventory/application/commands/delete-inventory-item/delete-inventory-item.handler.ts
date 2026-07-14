import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import {
  NOTIFICATION_DISPATCHER_PORT,
  INotificationDispatcherPort,
} from '@contexts/inventory/application/ports/notification-dispatcher.port';
import { AssertInventoryItemExistsService } from '@contexts/inventory/application/services/write/assert-inventory-item-exists/assert-inventory-item-exists.service';
import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import { InventoryNotificationConditionEnum } from '@contexts/inventory/domain/enums/inventory-notification-condition.enum';
import {
  INVENTORY_ITEM_WRITE_REPOSITORY,
  IInventoryItemWriteRepository,
} from '@contexts/inventory/domain/repositories/write/inventory-item-write.repository';

import { DeleteInventoryItemCommand } from './delete-inventory-item.command';

@CommandHandler(DeleteInventoryItemCommand)
export class DeleteInventoryItemCommandHandler
  extends BaseCommandHandler<DeleteInventoryItemCommand, InventoryItemAggregate>
  implements ICommandHandler<DeleteInventoryItemCommand, void>
{
  private readonly logger = new Logger(DeleteInventoryItemCommandHandler.name);

  constructor(
    @Inject(INVENTORY_ITEM_WRITE_REPOSITORY)
    private readonly inventoryItemWriteRepository: IInventoryItemWriteRepository,
    private readonly assertInventoryItemExistsService: AssertInventoryItemExistsService,
    @Inject(NOTIFICATION_DISPATCHER_PORT)
    private readonly notificationDispatcherPort: INotificationDispatcherPort,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeleteInventoryItemCommand): Promise<void> {
    const item = await this.assertInventoryItemExistsService.execute(
      command.id,
    );

    item.delete();

    await this.inventoryItemWriteRepository.delete(item.id.value);
    await this.publishEvents(item);

    this.logger.log(`Inventory item deleted: ${command.id.value}`);

    await this.resolveNotifications(item.id.value);
  }

  private async resolveNotifications(referenceId: string): Promise<void> {
    await this.notificationDispatcherPort.dispatch({
      condition: InventoryNotificationConditionEnum.LOW_STOCK,
      referenceId,
      payload: {},
      active: false,
    });
    await this.notificationDispatcherPort.dispatch({
      condition: InventoryNotificationConditionEnum.EXPIRING_SOON,
      referenceId,
      payload: {},
      active: false,
    });
  }
}
