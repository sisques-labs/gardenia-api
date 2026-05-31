import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';
import {
  IQrWriteRepository,
  QR_WRITE_REPOSITORY,
} from '@contexts/qr/domain/repositories/write/qr-write.repository';

import { DeleteQrByPlantIdCommand } from './delete-qr-by-plant-id.command';

@CommandHandler(DeleteQrByPlantIdCommand)
export class DeleteQrByPlantIdCommandHandler
  extends BaseCommandHandler<DeleteQrByPlantIdCommand, QrAggregate>
  implements ICommandHandler<DeleteQrByPlantIdCommand, void>
{
  private readonly logger = new Logger(DeleteQrByPlantIdCommandHandler.name);

  constructor(
    @Inject(QR_WRITE_REPOSITORY)
    private readonly qrWriteRepository: IQrWriteRepository,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeleteQrByPlantIdCommand): Promise<void> {
    const qr = await this.qrWriteRepository.findByPlantId(command.plantId);
    if (!qr) {
      return;
    }

    qr.delete();
    await this.qrWriteRepository.deleteByPlantId(command.plantId);
    await this.publishEvents(qr);

    this.logger.log(`QR deleted for plant: ${command.plantId}`);
  }
}
