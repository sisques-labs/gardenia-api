import { EventBus } from '@nestjs/cqrs';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { IFilesPort } from '@contexts/plant-photos/application/ports/files.port';
import { AssertPlantPhotoExistsService } from '@contexts/plant-photos/application/services/write/assert-plant-photo-exists/assert-plant-photo-exists.service';
import { AssertPlantPhotoOwnershipService } from '@contexts/plant-photos/application/services/write/assert-plant-photo-ownership/assert-plant-photo-ownership.service';
import { SyncPlantImageUrlAfterDeleteService } from '@contexts/plant-photos/application/services/write/sync-plant-image-url-after-delete/sync-plant-image-url-after-delete.service';
import { PlantPhotoAggregate } from '@contexts/plant-photos/domain/aggregates/plant-photo.aggregate';
import { PlantPhotoForbiddenException } from '@contexts/plant-photos/domain/exceptions/plant-photo-forbidden.exception';
import { IPlantPhotoWriteRepository } from '@contexts/plant-photos/domain/repositories/write/plant-photo-write.repository';
import { PlantPhotoIdValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-id/plant-photo-id.value-object';
import { PlantPhotoUrlValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-url/plant-photo-url.value-object';
import { DeletePlantPhotoCommand } from './delete-plant-photo.command';
import { DeletePlantPhotoCommandHandler } from './delete-plant-photo.handler';

const PHOTO_ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '440e8400-e29b-41d4-a716-446655440003';
const FILE_ID = '330e8400-e29b-41d4-a716-446655440004';
const OWNER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const URL = '/api/files/330e8400/content';

function buildPhoto(): PlantPhotoAggregate {
  return new PlantPhotoAggregate({
    id: new PlantPhotoIdValueObject(PHOTO_ID),
    plantId: new UuidValueObject(PLANT_ID),
    fileId: new UuidValueObject(FILE_ID),
    url: new PlantPhotoUrlValueObject(URL),
    userId: new UuidValueObject(OWNER_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('DeletePlantPhotoCommandHandler', () => {
  let handler: DeletePlantPhotoCommandHandler;
  let writeRepository: jest.Mocked<IPlantPhotoWriteRepository>;
  let filesPort: jest.Mocked<IFilesPort>;
  let assertExistsService: jest.Mocked<AssertPlantPhotoExistsService>;
  let assertOwnershipService: jest.Mocked<AssertPlantPhotoOwnershipService>;
  let syncPlantImageUrlAfterDeleteService: jest.Mocked<SyncPlantImageUrlAfterDeleteService>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    writeRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantPhotoWriteRepository>;

    filesPort = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };

    assertExistsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertPlantPhotoExistsService>;

    assertOwnershipService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertPlantPhotoOwnershipService>;

    syncPlantImageUrlAfterDeleteService = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<SyncPlantImageUrlAfterDeleteService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new DeletePlantPhotoCommandHandler(
      writeRepository,
      filesPort,
      assertExistsService,
      assertOwnershipService,
      syncPlantImageUrlAfterDeleteService,
      eventBus,
    );
  });

  it('deletes the file, the record, and resyncs via SyncPlantImageUrlAfterDeleteService', async () => {
    const photo = buildPhoto();
    assertExistsService.execute.mockResolvedValue(photo);

    await handler.execute(
      new DeletePlantPhotoCommand({ id: PHOTO_ID, requestingUserId: OWNER_ID }),
    );

    expect(assertOwnershipService.execute).toHaveBeenCalledWith(
      photo,
      expect.objectContaining({ value: OWNER_ID }),
    );
    expect(filesPort.deleteFile).toHaveBeenCalledWith(FILE_ID);
    expect(writeRepository.delete).toHaveBeenCalledWith(PHOTO_ID);
    expect(syncPlantImageUrlAfterDeleteService.execute).toHaveBeenCalledWith(
      photo,
    );
  });

  it('propagates PlantPhotoForbiddenException from the ownership service and does not delete', async () => {
    const photo = buildPhoto();
    assertExistsService.execute.mockResolvedValue(photo);
    assertOwnershipService.execute.mockImplementation(() => {
      throw new PlantPhotoForbiddenException(PHOTO_ID);
    });

    await expect(
      handler.execute(
        new DeletePlantPhotoCommand({
          id: PHOTO_ID,
          requestingUserId: OWNER_ID,
        }),
      ),
    ).rejects.toThrow(PlantPhotoForbiddenException);

    expect(writeRepository.delete).not.toHaveBeenCalled();
    expect(filesPort.deleteFile).not.toHaveBeenCalled();
  });
});
