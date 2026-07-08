import {
  DateValueObject,
  PaginatedResult,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { IPlantsPort } from '@contexts/plant-photos/application/ports/plants.port';
import { PlantPhotoAggregate } from '@contexts/plant-photos/domain/aggregates/plant-photo.aggregate';
import { IPlantPhotoReadRepository } from '@contexts/plant-photos/domain/repositories/read/plant-photo-read.repository';
import { PlantPhotoIdValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-id/plant-photo-id.value-object';
import { PlantPhotoUrlValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-url/plant-photo-url.value-object';
import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';
import { SyncPlantImageUrlService } from './sync-plant-image-url.service';

const PHOTO_ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '440e8400-e29b-41d4-a716-446655440003';
const OWNER_ID = '660e8400-e29b-41d4-a716-446655440001';
const URL = '/api/files/330e8400/content';

function buildPhoto(): PlantPhotoAggregate {
  return new PlantPhotoAggregate({
    id: new PlantPhotoIdValueObject(PHOTO_ID),
    plantId: new UuidValueObject(PLANT_ID),
    fileId: new UuidValueObject('330e8400-e29b-41d4-a716-446655440004'),
    url: new PlantPhotoUrlValueObject(URL),
    userId: new UuidValueObject(OWNER_ID),
    spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('SyncPlantImageUrlService', () => {
  let plantsPort: jest.Mocked<IPlantsPort>;
  let readRepository: jest.Mocked<IPlantPhotoReadRepository>;
  let service: SyncPlantImageUrlService;

  beforeEach(() => {
    plantsPort = {
      getImageUrl: jest.fn().mockResolvedValue(URL),
      updateImageUrl: jest.fn().mockResolvedValue(undefined),
    };
    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest
        .fn()
        .mockResolvedValue(new PaginatedResult([], 0, 1, 1)),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantPhotoReadRepository>;
    service = new SyncPlantImageUrlService(plantsPort, readRepository);
  });

  describe('afterUpload', () => {
    it('syncs plants.imageUrl to the new photo url', async () => {
      await service.afterUpload(PLANT_ID, URL, OWNER_ID);

      expect(plantsPort.updateImageUrl).toHaveBeenCalledWith(
        PLANT_ID,
        URL,
        OWNER_ID,
      );
    });

    it('does not throw when the sync fails', async () => {
      plantsPort.updateImageUrl.mockRejectedValue(new Error('plant gone'));

      await expect(
        service.afterUpload(PLANT_ID, URL, OWNER_ID),
      ).resolves.toBeUndefined();
    });
  });

  describe('afterDelete', () => {
    it('resyncs to the next most recent photo when the deleted one was current', async () => {
      readRepository.findByCriteria.mockResolvedValue(
        new PaginatedResult(
          [{ url: '/api/files/next/content' } as PlantPhotoViewModel],
          1,
          1,
          1,
        ),
      );

      await service.afterDelete(buildPhoto());

      expect(plantsPort.updateImageUrl).toHaveBeenCalledWith(
        PLANT_ID,
        '/api/files/next/content',
        OWNER_ID,
      );
    });

    it('resyncs to null when no photos remain', async () => {
      await service.afterDelete(buildPhoto());

      expect(plantsPort.updateImageUrl).toHaveBeenCalledWith(
        PLANT_ID,
        null,
        OWNER_ID,
      );
    });

    it('does not touch imageUrl when the deleted photo was not the current one', async () => {
      plantsPort.getImageUrl.mockResolvedValue('/api/files/other/content');

      await service.afterDelete(buildPhoto());

      expect(plantsPort.updateImageUrl).not.toHaveBeenCalled();
    });

    it('does not throw when the resync fails', async () => {
      plantsPort.getImageUrl.mockRejectedValue(new Error('plants down'));

      await expect(service.afterDelete(buildPhoto())).resolves.toBeUndefined();
    });
  });
});
