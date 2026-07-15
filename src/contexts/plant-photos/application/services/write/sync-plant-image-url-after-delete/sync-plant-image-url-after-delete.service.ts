import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  Criteria,
  FilterOperator,
  IBaseService,
  SortDirection,
} from '@sisques-labs/nestjs-kit';

import {
  PLANTS_PORT,
  IPlantsPort,
} from '@contexts/plant-photos/application/ports/plants.port';
import { PlantPhotoAggregate } from '@contexts/plant-photos/domain/aggregates/plant-photo.aggregate';
import {
  PLANT_PHOTO_READ_REPOSITORY,
  IPlantPhotoReadRepository,
} from '@contexts/plant-photos/domain/repositories/read/plant-photo-read.repository';

/**
 * Best-effort: a dangling `plantId` or a `plants` outage must not fail an
 * otherwise-successful delete — the `PlantPhoto` record itself is the source
 * of truth for history, this is only a convenience mirror for UI that hasn't
 * adopted a gallery view yet.
 */
@Injectable()
export class SyncPlantImageUrlAfterDeleteService implements IBaseService<
  PlantPhotoAggregate,
  void
> {
  private readonly logger = new Logger(
    SyncPlantImageUrlAfterDeleteService.name,
  );

  constructor(
    @Inject(PLANTS_PORT)
    private readonly plantsPort: IPlantsPort,
    @Inject(PLANT_PHOTO_READ_REPOSITORY)
    private readonly plantPhotoReadRepository: IPlantPhotoReadRepository,
  ) {}

  async execute(deletedPhoto: PlantPhotoAggregate): Promise<void> {
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
