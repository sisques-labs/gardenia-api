import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import {
  BaseCommandHandler,
  Criteria,
  FilterOperator,
  SortDirection,
} from '@sisques-labs/nestjs-kit';

import {
  FILES_PORT,
  IFilesPort,
} from '@contexts/plant-photos/application/ports/files.port';
import {
  PLANTS_PORT,
  IPlantsPort,
} from '@contexts/plant-photos/application/ports/plants.port';
import { AssertPlantPhotoExistsService } from '@contexts/plant-photos/application/services/write/assert-plant-photo-exists/assert-plant-photo-exists.service';
import { PlantPhotoAggregate } from '@contexts/plant-photos/domain/aggregates/plant-photo.aggregate';
import { PlantPhotoForbiddenException } from '@contexts/plant-photos/domain/exceptions/plant-photo-forbidden.exception';
import {
  PLANT_PHOTO_READ_REPOSITORY,
  IPlantPhotoReadRepository,
} from '@contexts/plant-photos/domain/repositories/read/plant-photo-read.repository';
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
    @Inject(PLANT_PHOTO_READ_REPOSITORY)
    private readonly plantPhotoReadRepository: IPlantPhotoReadRepository,
    @Inject(FILES_PORT)
    private readonly filesPort: IFilesPort,
    @Inject(PLANTS_PORT)
    private readonly plantsPort: IPlantsPort,
    private readonly assertPlantPhotoExistsService: AssertPlantPhotoExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeletePlantPhotoCommand): Promise<void> {
    const photo = await this.assertPlantPhotoExistsService.execute(command.id);

    if (photo.userId.value !== command.requestingUserId.value) {
      throw new PlantPhotoForbiddenException(command.id.value);
    }

    photo.delete();

    await this.filesPort.deleteFile(photo.fileId.value);
    await this.plantPhotoWriteRepository.delete(photo.id.value);
    await this.publishEvents(photo);

    this.logger.log(`Plant photo deleted: ${command.id.value}`);

    await this.resyncPlantImageUrlIfNeeded(photo);
  }

  private async resyncPlantImageUrlIfNeeded(
    deletedPhoto: PlantPhotoAggregate,
  ): Promise<void> {
    try {
      const currentImageUrl = await this.plantsPort.getImageUrl(
        deletedPhoto.plantId.value,
      );
      if (currentImageUrl !== deletedPhoto.url.value) return;

      const remaining = await this.plantPhotoReadRepository.findByCriteria(
        new Criteria(
          [
            {
              field: 'plantId',
              operator: FilterOperator.EQUALS,
              value: deletedPhoto.plantId.value,
            },
          ],
          [{ field: 'createdAt', direction: SortDirection.DESC }],
          { page: 1, perPage: 1 },
        ),
      );

      const nextUrl = remaining.items[0]?.url ?? null;
      await this.plantsPort.updateImageUrl(
        deletedPhoto.plantId.value,
        nextUrl,
        deletedPhoto.userId.value,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to resync plants.imageUrl after deleting photo ${deletedPhoto.id.value}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
