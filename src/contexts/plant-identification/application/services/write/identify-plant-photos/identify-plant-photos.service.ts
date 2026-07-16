import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  IBaseService,
  MimeTypeValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { IdentifyPlantPhotoCommandItem } from '@contexts/plant-identification/application/commands/identify-plant/identify-plant-photo.command-item';
import {
  IPlantNetIdentificationPort,
  PLANTNET_IDENTIFICATION_PORT,
} from '@contexts/plant-identification/application/ports/plantnet-identification.port';
import { PlantNetIdentificationCandidateResult } from '@contexts/plant-identification/application/ports/plantnet-identification-candidate.result';
import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationProjectValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-project/plant-identification-project.value-object';

export interface IdentifyPlantPhotosServiceInput {
  photos: IdentifyPlantPhotoCommandItem[];
  project: PlantIdentificationProjectValueObject | null;
  userId: UuidValueObject;
}

/**
 * Sends every submitted photo (with its organ) in ONE request to the
 * identification provider — never one request per photo, so it can use the
 * extra images/organs of the same plant to improve one scored result. Which
 * provider answers this call is an infrastructure detail behind
 * `IPlantNetIdentificationPort` — this service only knows it as "the
 * identification provider".
 */
@Injectable()
export class IdentifyPlantPhotosService implements IBaseService<
  IdentifyPlantPhotosServiceInput,
  PlantNetIdentificationCandidateResult[]
> {
  private readonly logger = new Logger(IdentifyPlantPhotosService.name);

  constructor(
    @Inject(PLANTNET_IDENTIFICATION_PORT)
    private readonly plantNetIdentificationPort: IPlantNetIdentificationPort,
  ) {}

  async execute(
    input: IdentifyPlantPhotosServiceInput,
  ): Promise<PlantNetIdentificationCandidateResult[]> {
    this.logger.log(
      `Identifying plant from ${input.photos.length} photo(s) for user: ${input.userId.value}`,
    );

    return this.plantNetIdentificationPort
      .identify(
        input.photos.map((photo) => ({
          content: photo.content,
          mimeType: new MimeTypeValueObject(photo.mimeType.value),
          organ: photo.organ.value as PlantIdentificationOrganEnum,
        })),
        input.project?.value,
      )
      .catch((error: unknown) => {
        this.logger.error(
          `Plant identification failed for user ${input.userId.value}: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw error;
      });
  }
}
