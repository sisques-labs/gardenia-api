import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import {
  FILES_PORT,
  IFilesPort,
} from '@contexts/plant-photos/application/ports/files.port';
import { AssertPlantPhotoExistsService } from '@contexts/plant-photos/application/services/write/assert-plant-photo-exists/assert-plant-photo-exists.service';
import { AssertPlantPhotoOwnershipService } from '@contexts/plant-photos/application/services/write/assert-plant-photo-ownership/assert-plant-photo-ownership.service';
import { SyncPlantImageUrlAfterDeleteService } from '@contexts/plant-photos/application/services/write/sync-plant-image-url-after-delete/sync-plant-image-url-after-delete.service';
import { PlantPhotoAggregate } from '@contexts/plant-photos/domain/aggregates/plant-photo.aggregate';
import {
  PLANT_PHOTO_WRITE_REPOSITORY,
  IPlantPhotoWriteRepository,
} from '@contexts/plant-photos/domain/repositories/write/plant-photo-write.repository';

import { DeletePlantPhotoCommand } from './delete-plant-photo.command';

@CommandHandler(DeletePlantPhotoCommand)
export class DeletePlantPhotoCommandHandler
  extends BaseCommandHandler<DeletePlantPhotoCommand, PlantPhotoAggregate>
  implements ICommandHandler<DeletePlantPhotoCommand, void>
{
  private readonly logger = new Logger(DeletePlantPhotoCommandHandler.name);

  constructor(
    @Inject(PLANT_PHOTO_WRITE_REPOSITORY)
    private readonly plantPhotoWriteRepository: IPlantPhotoWriteRepository,
    @Inject(FILES_PORT)
    private readonly filesPort: IFilesPort,
    private readonly assertPlantPhotoExistsService: AssertPlantPhotoExistsService,
    private readonly assertPlantPhotoOwnershipService: AssertPlantPhotoOwnershipService,
    private readonly syncPlantImageUrlAfterDeleteService: SyncPlantImageUrlAfterDeleteService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeletePlantPhotoCommand): Promise<void> {
    const photo = await this.assertPlantPhotoExistsService.execute(command.id);

    this.assertPlantPhotoOwnershipService.execute(
      photo,
      command.requestingUserId,
    );

    photo.delete();

    await this.filesPort.deleteFile(photo.fileId.value);
    await this.plantPhotoWriteRepository.delete(photo.id.value);
    await this.publishEvents(photo);

    this.logger.log(`Plant photo deleted: ${command.id.value}`);

    await this.syncPlantImageUrlAfterDeleteService.execute(photo);
  }
}
