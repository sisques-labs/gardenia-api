import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';
import { QrBuilder } from '@contexts/qr/domain/builders/qr.builder';
import { QrAlreadyExistsForPlantException } from '@contexts/qr/domain/exceptions/qr-already-exists-for-plant.exception';
import {
  IQrPngGenerator,
  QR_PNG_GENERATOR,
} from '@contexts/qr/domain/ports/qr-png-generator.port';
import {
  IQrWriteRepository,
  QR_WRITE_REPOSITORY,
} from '@contexts/qr/domain/repositories/write/qr-write.repository';
import { QrTargetUrlBuilderService } from '../../services/read/qr-target-url-builder/qr-target-url-builder.service';

import { CreateQrForPlantCommand } from './create-qr-for-plant.command';

@CommandHandler(CreateQrForPlantCommand)
export class CreateQrForPlantCommandHandler
  extends BaseCommandHandler<CreateQrForPlantCommand, QrAggregate>
  implements ICommandHandler<CreateQrForPlantCommand, string>
{
  private readonly logger = new Logger(CreateQrForPlantCommandHandler.name);

  constructor(
    @Inject(QR_WRITE_REPOSITORY)
    private readonly qrWriteRepository: IQrWriteRepository,
    @Inject(QR_PNG_GENERATOR)
    private readonly qrPngGenerator: IQrPngGenerator,
    private readonly qrBuilder: QrBuilder,
    private readonly qrTargetUrlBuilder: QrTargetUrlBuilderService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreateQrForPlantCommand): Promise<string> {
    const existing = await this.qrWriteRepository.findByPlantId(
      command.plantId,
    );
    if (existing) {
      throw new QrAlreadyExistsForPlantException(command.plantId);
    }

    const targetUrl = this.qrTargetUrlBuilder.build(
      command.plantId,
      command.spaceId,
    );
    const pngImage = await this.qrPngGenerator.generate(targetUrl);
    const now = new Date();

    const qr = this.qrBuilder
      .withId(UuidValueObject.generate().value)
      .withPlantId(command.plantId)
      .withSpaceId(command.spaceId)
      .withTargetUrl(targetUrl)
      .withGeneration(1)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    qr.create();

    await this.qrWriteRepository.save(qr, pngImage);
    await this.publishEvents(qr);

    this.logger.log(`QR created: ${qr.id.value} for plant: ${command.plantId}`);

    return qr.id.value;
  }
}
