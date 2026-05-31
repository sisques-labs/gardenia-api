import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';
import { QrBuilder } from '@contexts/qr/domain/builders/qr.builder';
import {
  IQrPngGenerator,
  QR_PNG_GENERATOR,
} from '@contexts/qr/domain/ports/qr-png-generator.port';
import {
  IQrWriteRepository,
  QR_WRITE_REPOSITORY,
} from '@contexts/qr/domain/repositories/write/qr-write.repository';

import { CreateQrCommand } from './create-qr.command';

@CommandHandler(CreateQrCommand)
export class CreateQrCommandHandler
  extends BaseCommandHandler<CreateQrCommand, QrAggregate>
  implements ICommandHandler<CreateQrCommand, string>
{
  private readonly logger = new Logger(CreateQrCommandHandler.name);

  constructor(
    @Inject(QR_WRITE_REPOSITORY)
    private readonly qrWriteRepository: IQrWriteRepository,
    @Inject(QR_PNG_GENERATOR)
    private readonly qrPngGenerator: IQrPngGenerator,
    private readonly qrBuilder: QrBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreateQrCommand): Promise<string> {
    const pngImage = await this.qrPngGenerator.generate(
      command.targetUrl.value,
    );
    const now = new Date();

    const qr = this.qrBuilder
      .withId(UuidValueObject.generate().value)
      .withSpaceId(command.spaceId.value)
      .withTargetUrl(command.targetUrl.value)
      .withGeneration(1)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    qr.create();

    await this.qrWriteRepository.save(qr, pngImage);
    await this.publishEvents(qr);

    this.logger.log(`QR created: ${qr.id.value}`);

    return qr.id.value;
  }
}
