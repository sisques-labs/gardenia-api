import { Injectable } from '@nestjs/common';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantPhotoAggregate } from '@contexts/plant-photos/domain/aggregates/plant-photo.aggregate';
import { PlantPhotoForbiddenException } from '@contexts/plant-photos/domain/exceptions/plant-photo-forbidden.exception';

@Injectable()
export class AssertPlantPhotoOwnershipService {
  execute(photo: PlantPhotoAggregate, requestingUserId: UuidValueObject): void {
    if (photo.userId.value !== requestingUserId.value) {
      throw new PlantPhotoForbiddenException(photo.id.value);
    }
  }
}
