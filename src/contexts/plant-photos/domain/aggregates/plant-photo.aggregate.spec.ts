import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantPhotoDeletedEvent } from '@contexts/plant-photos/domain/events/plant-photo-deleted/plant-photo-deleted.event';
import { PlantPhotoUploadedEvent } from '@contexts/plant-photos/domain/events/plant-photo-uploaded/plant-photo-uploaded.event';
import { PlantPhotoIdValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-id/plant-photo-id.value-object';
import { PlantPhotoUrlValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-url/plant-photo-url.value-object';
import { PlantPhotoAggregate } from './plant-photo.aggregate';

function buildPlantPhoto(): PlantPhotoAggregate {
  return new PlantPhotoAggregate({
    id: new PlantPhotoIdValueObject('550e8400-e29b-41d4-a716-446655440000'),
    plantId: new UuidValueObject('440e8400-e29b-41d4-a716-446655440003'),
    fileId: new UuidValueObject('330e8400-e29b-41d4-a716-446655440004'),
    url: new PlantPhotoUrlValueObject('/api/files/550e8400/content'),
    userId: new UuidValueObject('660e8400-e29b-41d4-a716-446655440001'),
    spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('PlantPhotoAggregate', () => {
  it('create() applies PlantPhotoUploadedEvent', () => {
    const photo = buildPlantPhoto();
    photo.create();
    const events = photo.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PlantPhotoUploadedEvent);
  });

  it('delete() applies PlantPhotoDeletedEvent', () => {
    const photo = buildPlantPhoto();
    photo.delete();
    const events = photo.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PlantPhotoDeletedEvent);
  });

  it('toPrimitives() exposes all fields', () => {
    const primitives = buildPlantPhoto().toPrimitives();
    expect(primitives).toMatchObject({
      plantId: '440e8400-e29b-41d4-a716-446655440003',
      fileId: '330e8400-e29b-41d4-a716-446655440004',
      url: '/api/files/550e8400/content',
      userId: '660e8400-e29b-41d4-a716-446655440001',
      spaceId: '770e8400-e29b-41d4-a716-446655440002',
    });
  });
});
