import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';
import {
  IQrPngGenerator,
  QR_PNG_GENERATOR,
} from '@contexts/qr/domain/ports/qr-png-generator.port';
import {
  IQrWriteRepository,
  QR_WRITE_REPOSITORY,
} from '@contexts/qr/domain/repositories/write/qr-write.repository';
import { QrIdValueObject } from '@contexts/qr/domain/value-objects/qr-id/qr-id.value-object';
import { AssertQrExistsService } from '@contexts/qr/application/services/write/assert-qr-exists/assert-qr-exists.service';

import { RegenerateQrCommand } from './regenerate-qr.command';

@CommandHandler(RegenerateQrCommand)
export class RegenerateQrCommandHandler
  extends BaseCommandHandler<RegenerateQrCommand, QrAggregate>
  implements ICommandHandler<RegenerateQrCommand, void>
{
  private readonly logger = new Logger(RegenerateQrCommandHandler.name);

  constructor(
    @Inject(QR_WRITE_REPOSITORY)
    private readonly qrWriteRepository: IQrWriteRepository,
    @Inject(QR_PNG_GENERATOR)
    private readonly qrPngGenerator: IQrPngGenerator,
    private readonly assertQrExistsService: AssertQrExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: RegenerateQrCommand): Promise<void> {
    const qr = await this.assertQrExistsService.execute(
      new QrIdValueObject(command.qrId),
    );

    const pngImage = await this.qrPngGenerator.generate(qr.targetUrl.value);
    qr.regenerate();

    await this.qrWriteRepository.save(qr, pngImage);
    await this.publishEvents(qr);

    this.logger.log(`QR regenerated: ${command.qrId}`);
  }
}
