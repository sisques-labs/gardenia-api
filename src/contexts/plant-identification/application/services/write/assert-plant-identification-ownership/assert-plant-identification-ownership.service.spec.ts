import {
  DateValueObject,
  NumberValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationForbiddenException } from '@contexts/plant-identification/domain/exceptions/plant-identification-forbidden.exception';
import { PlantIdentificationIdValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-id/plant-identification-id.value-object';
import { PlantIdentificationStatusValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-status/plant-identification-status.value-object';
import { AssertPlantIdentificationOwnershipService } from './assert-plant-identification-ownership.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const OWNER_ID = '660e8400-e29b-41d4-a716-446655440001';
const OTHER_USER_ID = '660e8400-e29b-41d4-a716-446655440099';

function buildIdentification(): PlantIdentificationAggregate {
  return new PlantIdentificationAggregate({
    id: new PlantIdentificationIdValueObject(ID),
    requestedByUserId: new UuidValueObject(OWNER_ID),
    spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    status: new PlantIdentificationStatusValueObject(
      PlantIdentificationStatusEnum.RESOLVED,
    ),
    resolvedGbifKey: new NumberValueObject(2882337),
    resolvedScientificName: new StringValueObject('Monstera deliciosa'),
    convertedToPlantId: null,
    photos: [],
    candidates: [],
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('AssertPlantIdentificationOwnershipService', () => {
  const service = new AssertPlantIdentificationOwnershipService();

  it('does not throw when the requesting user is the requester', () => {
    expect(() =>
      service.execute(buildIdentification(), new UuidValueObject(OWNER_ID)),
    ).not.toThrow();
  });

  it('throws PlantIdentificationForbiddenException otherwise', () => {
    expect(() =>
      service.execute(
        buildIdentification(),
        new UuidValueObject(OTHER_USER_ID),
      ),
    ).toThrow(PlantIdentificationForbiddenException);
  });
});
