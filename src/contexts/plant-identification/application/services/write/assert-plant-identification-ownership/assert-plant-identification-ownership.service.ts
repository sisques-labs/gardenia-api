import { Injectable } from '@nestjs/common';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';
import { PlantIdentificationForbiddenException } from '@contexts/plant-identification/domain/exceptions/plant-identification-forbidden.exception';

@Injectable()
export class AssertPlantIdentificationOwnershipService {
  execute(
    identification: PlantIdentificationAggregate,
    requestingUserId: UuidValueObject,
  ): void {
    if (identification.requestedByUserId.value !== requestingUserId.value) {
      throw new PlantIdentificationForbiddenException(identification.id.value);
    }
  }
}
