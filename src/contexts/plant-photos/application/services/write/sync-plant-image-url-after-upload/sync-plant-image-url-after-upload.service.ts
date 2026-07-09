import { Inject, Injectable, Logger } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import {
  PLANTS_PORT,
  IPlantsPort,
} from '@contexts/plant-photos/application/ports/plants.port';

export interface SyncPlantImageUrlAfterUploadServiceInput {
  plantId: string;
  url: string;
  requestingUserId: string;
}

/**
 * Best-effort: a dangling `plantId` or a `plants` outage must not fail an
 * otherwise-successful upload — the `PlantPhoto` record itself is the source
 * of truth for history, this is only a convenience mirror for UI that hasn't
 * adopted a gallery view yet.
 */
@Injectable()
export class SyncPlantImageUrlAfterUploadService implements IBaseService<
  SyncPlantImageUrlAfterUploadServiceInput,
  void
> {
  private readonly logger = new Logger(
    SyncPlantImageUrlAfterUploadService.name,
  );

  constructor(
    @Inject(PLANTS_PORT)
    private readonly plantsPort: IPlantsPort,
  ) {}

  async execute(
    input: SyncPlantImageUrlAfterUploadServiceInput,
  ): Promise<void> {
    await this.plantsPort
      .updateImageUrl(input.plantId, input.url, input.requestingUserId)
      .catch((error: unknown) => {
        this.logger.warn(
          `Failed to sync plants.imageUrl for plant ${input.plantId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
  }
}
