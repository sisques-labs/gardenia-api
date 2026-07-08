import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import {
  FILES_PORT,
  IFilesPort,
} from '@contexts/plant-photos/application/ports/files.port';
import { SyncPlantImageUrlService } from '@contexts/plant-photos/application/services/write/sync-plant-image-url/sync-plant-image-url.service';
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
    private readonly syncPlantImageUrlService: SyncPlantImageUrlService,
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
      userId: command.userId,
      spaceId: command.spaceId,
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

    await this.syncPlantImageUrlService.afterUpload(
      command.plantId.value,
      uploadedFile.url,
      command.userId.value,
    );

    return {
      id: photoId,
      plantId: command.plantId.value,
      fileId: uploadedFile.id,
      url: uploadedFile.url,
      createdAt: now,
    };
  }
}
