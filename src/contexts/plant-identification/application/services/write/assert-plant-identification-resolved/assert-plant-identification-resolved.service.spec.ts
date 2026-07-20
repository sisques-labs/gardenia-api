import {
  DateValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationNotResolvedException } from '@contexts/plant-identification/domain/exceptions/plant-identification-not-resolved.exception';
import { PlantIdentificationIdValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-id/plant-identification-id.value-object';
import { PlantIdentificationSpeciesKeyValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-species-key/plant-identification-species-key.value-object';
import { PlantIdentificationSpeciesProviderValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-species-provider/plant-identification-species-provider.value-object';
import { PlantIdentificationStatusValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-status/plant-identification-status.value-object';
import { AssertPlantIdentificationResolvedService } from './assert-plant-identification-resolved.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

function buildIdentification(resolved: boolean): PlantIdentificationAggregate {
  return new PlantIdentificationAggregate({
    id: new PlantIdentificationIdValueObject(ID),
    requestedByUserId: new UuidValueObject(
      '660e8400-e29b-41d4-a716-446655440001',
    ),
    spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    status: new PlantIdentificationStatusValueObject(
      resolved
        ? PlantIdentificationStatusEnum.RESOLVED
        : PlantIdentificationStatusEnum.NO_MATCH,
    ),
    resolvedSpeciesKey: resolved
      ? new PlantIdentificationSpeciesKeyValueObject(2882337)
      : null,
    resolvedScientificName: resolved
      ? new StringValueObject('Monstera deliciosa')
      : null,
    resolvedSpeciesProvider: resolved
      ? new PlantIdentificationSpeciesProviderValueObject('gbif')
      : null,
    convertedToPlantId: null,
    photos: [],
    candidates: [],
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('AssertPlantIdentificationResolvedService', () => {
  const service = new AssertPlantIdentificationResolvedService();

  it('returns the resolved species key/scientific name when resolved', () => {
    const result = service.execute(buildIdentification(true));

    expect(result.speciesKey.value).toBe(2882337);
    expect(result.scientificName.value).toBe('Monstera deliciosa');
  });

  it('throws PlantIdentificationNotResolvedException otherwise', () => {
    expect(() => service.execute(buildIdentification(false))).toThrow(
      PlantIdentificationNotResolvedException,
    );
  });
});
