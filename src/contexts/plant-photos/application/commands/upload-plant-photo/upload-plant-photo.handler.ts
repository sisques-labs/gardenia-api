import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import {
  FILES_PORT,
  IFilesPort,
} from '@contexts/plant-photos/application/ports/files.port';
import {
  PLANTS_PORT,
  IPlantsPort,
} from '@contexts/plant-photos/application/ports/plants.port';
import { PlantPhotoAggregate } from '@contexts/plant-photos/domain/aggregates/plant-photo.aggregate';
import { PlantPhotoBuilder } from '@contexts/plant-photos/domain/builders/plant-photo.builder';
import {
  PLANT_PHOTO_WRITE_REPOSITORY,
  IPlantPhotoWriteRepository,
} from '@contexts/plant-photos/domain/repositories/write/plant-photo-write.repository';

import { UploadPlantPhotoCommand } from './upload-plant-photo.command';
import { UploadPlantPhotoResult } from './upload-plant-photo.result';

@CommandHandler(UploadPlantPhotoCommand)
export class UploadPlantPhotoCommandHandler
  extends BaseCommandHandler<UploadPlantPhotoCommand, PlantPhotoAggregate>
  implements ICommandHandler<UploadPlantPhotoCommand, UploadPlantPhotoResult>
{
  private readonly logger = new Logger(UploadPlantPhotoCommandHandler.name);

  constructor(
    @Inject(PLANT_PHOTO_WRITE_REPOSITORY)
    private readonly plantPhotoWriteRepository: IPlantPhotoWriteRepository,
    @Inject(FILES_PORT)
    private readonly filesPort: IFilesPort,
    @Inject(PLANTS_PORT)
    private readonly plantsPort: IPlantsPort,
    private readonly plantPhotoBuilder: PlantPhotoBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(
    command: UploadPlantPhotoCommand,
  ): Promise<UploadPlantPhotoResult> {
    const now = new Date();
    const photoId = UuidValueObject.generate().value;

    const uploadedFile = await this.filesPort.uploadFile({
      filename: command.filename,
      mimeType: command.mimeType,
      size: command.size,
      content: command.content,
      userId: command.userId.value,
      spaceId: command.spaceId.value,
    });

    const photo = this.plantPhotoBuilder
      .withId(photoId)
      .withPlantId(command.plantId.value)
      .withFileId(uploadedFile.id)
      .withUrl(uploadedFile.url)
      .withUserId(command.userId.value)
      .withSpaceId(command.spaceId.value)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    photo.create();

    await this.plantPhotoWriteRepository.save(photo);
    await this.publishEvents(photo);

    this.logger.log(
      `Plant photo uploaded: ${photoId} for plant: ${command.plantId.value} by user: ${command.userId.value}`,
    );

    // Best-effort mirror — a dangling plantId or a plants outage must not
    // fail an otherwise-successful photo upload.
    await this.plantsPort
      .updateImageUrl(
        command.plantId.value,
        uploadedFile.url,
        command.userId.value,
      )
      .catch((error: unknown) => {
        this.logger.warn(
          `Failed to sync plants.imageUrl for plant ${command.plantId.value}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });

    return {
      id: photoId,
      plantId: command.plantId.value,
      fileId: uploadedFile.id,
      url: uploadedFile.url,
      createdAt: now,
    };
  }
}
