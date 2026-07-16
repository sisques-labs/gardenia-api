import { Injectable } from '@nestjs/common';

import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';
import { PlantIdentificationAlreadyConvertedException } from '@contexts/plant-identification/domain/exceptions/plant-identification-already-converted.exception';

/**
 * Checked BEFORE the cross-context write in `CreatePlantFromIdentification`
 * (not just left to `convertToPlant()`'s own guard, which only fires
 * afterward) — a double-submit/retry against an already-converted
 * identification must not create a second orphaned Plant before the 409
 * surfaces.
 */
@Injectable()
export class AssertPlantIdentificationNotConvertedService {
  execute(identification: PlantIdentificationAggregate): void {
    if (identification.convertedToPlantId) {
      throw new PlantIdentificationAlreadyConvertedException(
        identification.id.value,
      );
    }
  }
}
