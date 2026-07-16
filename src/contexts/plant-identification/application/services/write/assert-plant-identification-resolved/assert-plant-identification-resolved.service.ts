import { Injectable } from '@nestjs/common';

import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';
import { PlantIdentificationNotResolvedException } from '@contexts/plant-identification/domain/exceptions/plant-identification-not-resolved.exception';
import { PlantIdentificationResolvedScientificNameValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-resolved-scientific-name/plant-identification-resolved-scientific-name.value-object';
import { PlantIdentificationSpeciesKeyValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-species-key/plant-identification-species-key.value-object';

export interface ResolvedPlantIdentification {
  speciesKey: PlantIdentificationSpeciesKeyValueObject;
  scientificName: PlantIdentificationResolvedScientificNameValueObject;
}

@Injectable()
export class AssertPlantIdentificationResolvedService {
  execute(
    identification: PlantIdentificationAggregate,
  ): ResolvedPlantIdentification {
    if (
      !identification.resolvedSpeciesKey ||
      !identification.resolvedScientificName
    ) {
      throw new PlantIdentificationNotResolvedException(
        identification.id.value,
      );
    }
    return {
      speciesKey: identification.resolvedSpeciesKey,
      scientificName: identification.resolvedScientificName,
    };
  }
}
