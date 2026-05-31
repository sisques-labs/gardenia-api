import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';
import {
  IQrWriteRepository,
  QR_WRITE_REPOSITORY,
} from '@contexts/qr/domain/repositories/write/qr-write.repository';
import { AssertQrExistsService } from '@contexts/qr/application/services/write/assert-qr-exists/assert-qr-exists.service';

import { DeleteQrCommand } from './delete-qr.command';

@CommandHandler(DeleteQrCommand)
export class DeleteQrCommandHandler
  extends BaseCommandHandler<DeleteQrCommand, QrAggregate>
  implements ICommandHandler<DeleteQrCommand, void>
{
  private readonly logger = new Logger(DeleteQrCommandHandler.name);

  constructor(
    @Inject(QR_WRITE_REPOSITORY)
    private readonly qrWriteRepository: IQrWriteRepository,
    private readonly assertQrExistsService: AssertQrExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeleteQrCommand): Promise<void> {
    const qr = await this.assertQrExistsService.execute(command.qrId);

    qr.delete();
    await this.qrWriteRepository.delete(command.qrId.value);
    await this.publishEvents(qr);

    this.logger.log(`QR deleted: ${command.qrId.value}`);
  }
}
