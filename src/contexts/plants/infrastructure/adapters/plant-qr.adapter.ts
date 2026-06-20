import {
  CreatePlantQrInput,
  IPlantQrPort,
} from '@contexts/plants/application/ports/plant-qr.port';
import { PlantQrBuilder } from '@contexts/plants/domain/builders/plant-qr.builder';
import { PlantQrViewModel } from '@contexts/plants/domain/view-models/plant-qr.view-model';
import { CreateQrCommand } from '@contexts/qr/application/commands/create-qr/create-qr.command';
import { DeleteQrCommand } from '@contexts/qr/application/commands/delete-qr/delete-qr.command';
import { QrFindByIdQuery } from '@contexts/qr/application/queries/qr-find-by-id/qr-find-by-id.query';
import { QrFindPngByIdQuery } from '@contexts/qr/application/queries/qr-find-png-by-id/qr-find-png-by-id.query';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

@Injectable()
export class PlantQrAdapter implements IPlantQrPort {
  private readonly logger = new Logger(PlantQrAdapter.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly plantQrBuilder: PlantQrBuilder,
  ) {}

  async createForPlant(input: CreatePlantQrInput): Promise<string> {
    this.logger.log(`Creating QR for space ${input.spaceId}`);

    const qrId = await this.commandBus.execute<CreateQrCommand, string>(
      new CreateQrCommand({
        targetUrl: input.targetUrl,
        spaceId: input.spaceId,
      }),
    );

    this.logger.debug(`QR created with id ${qrId}`);

    return qrId;
  }

  async delete(qrId: string): Promise<void> {
    this.logger.log(`Deleting QR ${qrId}`);

    await this.commandBus.execute(new DeleteQrCommand({ qrId }));
  }

  async findByQrId(qrId: string): Promise<PlantQrViewModel | null> {
    this.logger.log(`Fetching QR data for qrId ${qrId}`);

    const qrViewModel = await this.queryBus
      .execute<
        QrFindByIdQuery,
        QrViewModel | null
      >(new QrFindByIdQuery({ qrId }))
      .catch(() => null);

    if (!qrViewModel) {
      this.logger.warn(`QR not found for qrId ${qrId}`);
      return null;
    }

    const pngBuffer = await this.queryBus
      .execute<
        QrFindPngByIdQuery,
        Buffer | null
      >(new QrFindPngByIdQuery({ qrId }))
      .catch(() => null);

    if (!pngBuffer) {
      this.logger.warn(`QR PNG not found for qrId ${qrId}`);
      return null;
    }

    this.logger.debug(`QR data resolved for qrId ${qrId}`);

    return this.plantQrBuilder
      .withId(qrViewModel.id)
      .withSpaceId(qrViewModel.spaceId)
      .withTargetUrl(qrViewModel.targetUrl)
      .withGeneration(qrViewModel.generation)
      .withImage(pngBuffer.toString('base64'))
      .withCreatedAt(qrViewModel.createdAt)
      .withUpdatedAt(qrViewModel.updatedAt)
      .buildViewModel();
  }
}
