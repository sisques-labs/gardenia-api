import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantPhotoAggregate } from '@contexts/plant-photos/domain/aggregates/plant-photo.aggregate';
import { PlantPhotoForbiddenException } from '@contexts/plant-photos/domain/exceptions/plant-photo-forbidden.exception';
import { PlantPhotoIdValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-id/plant-photo-id.value-object';
import { PlantPhotoUrlValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-url/plant-photo-url.value-object';
import { AssertPlantPhotoOwnershipService } from './assert-plant-photo-ownership.service';

const PHOTO_ID = '550e8400-e29b-41d4-a716-446655440000';
const OWNER_ID = '660e8400-e29b-41d4-a716-446655440001';
const OTHER_USER_ID = '660e8400-e29b-41d4-a716-446655440099';

function buildPhoto(): PlantPhotoAggregate {
  return new PlantPhotoAggregate({
    id: new PlantPhotoIdValueObject(PHOTO_ID),
    plantId: new UuidValueObject('440e8400-e29b-41d4-a716-446655440003'),
    fileId: new UuidValueObject('330e8400-e29b-41d4-a716-446655440004'),
    url: new PlantPhotoUrlValueObject('/api/files/330e8400/content'),
    userId: new UuidValueObject(OWNER_ID),
    spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('AssertPlantPhotoOwnershipService', () => {
  const service = new AssertPlantPhotoOwnershipService();

  it('does not throw when the requesting user is the uploader', () => {
    expect(() =>
      service.execute(buildPhoto(), new UuidValueObject(OWNER_ID)),
    ).not.toThrow();
  });

  it('throws PlantPhotoForbiddenException when the requesting user is not the uploader', () => {
    expect(() =>
      service.execute(buildPhoto(), new UuidValueObject(OTHER_USER_ID)),
    ).toThrow(PlantPhotoForbiddenException);
  });
});
