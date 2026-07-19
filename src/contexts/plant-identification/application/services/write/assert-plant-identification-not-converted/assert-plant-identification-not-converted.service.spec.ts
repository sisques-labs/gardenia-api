import {
  DateValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationAlreadyConvertedException } from '@contexts/plant-identification/domain/exceptions/plant-identification-already-converted.exception';
import { PlantIdentificationIdValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-id/plant-identification-id.value-object';
import { PlantIdentificationSpeciesKeyValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-species-key/plant-identification-species-key.value-object';
import { PlantIdentificationSpeciesProviderValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-species-provider/plant-identification-species-provider.value-object';
import { PlantIdentificationStatusValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-status/plant-identification-status.value-object';
import { AssertPlantIdentificationNotConvertedService } from './assert-plant-identification-not-converted.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '440e8400-e29b-41d4-a716-446655440003';

function buildIdentification(
  convertedToPlantId: string | null,
): PlantIdentificationAggregate {
  return new PlantIdentificationAggregate({
    id: new PlantIdentificationIdValueObject(ID),
    requestedByUserId: new UuidValueObject(
      '660e8400-e29b-41d4-a716-446655440001',
    ),
    spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    status: new PlantIdentificationStatusValueObject(
      PlantIdentificationStatusEnum.RESOLVED,
    ),
    resolvedSpeciesKey: new PlantIdentificationSpeciesKeyValueObject(2882337),
    resolvedScientificName: new StringValueObject('Monstera deliciosa'),
    resolvedSpeciesProvider: new PlantIdentificationSpeciesProviderValueObject(
      'gbif',
    ),
    convertedToPlantId: convertedToPlantId
      ? new UuidValueObject(convertedToPlantId)
      : null,
    photos: [],
    candidates: [],
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('AssertPlantIdentificationNotConvertedService', () => {
  const service = new AssertPlantIdentificationNotConvertedService();

  it('does not throw when not yet converted', () => {
    expect(() => service.execute(buildIdentification(null))).not.toThrow();
  });

  it('throws PlantIdentificationAlreadyConvertedException otherwise', () => {
    expect(() => service.execute(buildIdentification(PLANT_ID))).toThrow(
      PlantIdentificationAlreadyConvertedException,
    );
  });
});
