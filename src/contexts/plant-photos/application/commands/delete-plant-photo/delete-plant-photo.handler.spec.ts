import { EventBus } from '@nestjs/cqrs';
import {
  DateValueObject,
  PaginatedResult,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { IFilesPort } from '@contexts/plant-photos/application/ports/files.port';
import { IPlantsPort } from '@contexts/plant-photos/application/ports/plants.port';
import { AssertPlantPhotoExistsService } from '@contexts/plant-photos/application/services/write/assert-plant-photo-exists/assert-plant-photo-exists.service';
import { PlantPhotoAggregate } from '@contexts/plant-photos/domain/aggregates/plant-photo.aggregate';
import { PlantPhotoForbiddenException } from '@contexts/plant-photos/domain/exceptions/plant-photo-forbidden.exception';
import { IPlantPhotoReadRepository } from '@contexts/plant-photos/domain/repositories/read/plant-photo-read.repository';
import { IPlantPhotoWriteRepository } from '@contexts/plant-photos/domain/repositories/write/plant-photo-write.repository';
import { PlantPhotoIdValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-id/plant-photo-id.value-object';
import { PlantPhotoUrlValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-url/plant-photo-url.value-object';
import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';
import { DeletePlantPhotoCommand } from './delete-plant-photo.command';
import { DeletePlantPhotoCommandHandler } from './delete-plant-photo.handler';

const PHOTO_ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '440e8400-e29b-41d4-a716-446655440003';
const FILE_ID = '330e8400-e29b-41d4-a716-446655440004';
const OWNER_ID = '660e8400-e29b-41d4-a716-446655440001';
const OTHER_USER_ID = '660e8400-e29b-41d4-a716-446655440099';
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
  let readRepository: jest.Mocked<IPlantPhotoReadRepository>;
  let filesPort: jest.Mocked<IFilesPort>;
  let plantsPort: jest.Mocked<IPlantsPort>;
  let assertExistsService: jest.Mocked<AssertPlantPhotoExistsService>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    writeRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantPhotoWriteRepository>;

    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest
        .fn()
        .mockResolvedValue(new PaginatedResult([], 0, 1, 1)),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantPhotoReadRepository>;

    filesPort = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };

    plantsPort = {
      getImageUrl: jest.fn().mockResolvedValue(URL),
      updateImageUrl: jest.fn().mockResolvedValue(undefined),
    };

    assertExistsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertPlantPhotoExistsService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new DeletePlantPhotoCommandHandler(
      writeRepository,
      readRepository,
      filesPort,
      plantsPort,
      assertExistsService,
      eventBus,
    );
  });

  it('deletes the file, the record, and resyncs imageUrl to the next most recent photo', async () => {
    const photo = buildPhoto();
    assertExistsService.execute.mockResolvedValue(photo);
    readRepository.findByCriteria.mockResolvedValue(
      new PaginatedResult(
        [{ url: '/api/files/next/content' } as PlantPhotoViewModel],
        1,
        1,
        1,
      ),
    );

    await handler.execute(
      new DeletePlantPhotoCommand({ id: PHOTO_ID, requestingUserId: OWNER_ID }),
    );

    expect(filesPort.deleteFile).toHaveBeenCalledWith(FILE_ID);
    expect(writeRepository.delete).toHaveBeenCalledWith(PHOTO_ID);
    expect(plantsPort.updateImageUrl).toHaveBeenCalledWith(
      PLANT_ID,
      '/api/files/next/content',
      OWNER_ID,
    );
  });

  it('resyncs to null when no photos remain', async () => {
    const photo = buildPhoto();
    assertExistsService.execute.mockResolvedValue(photo);
    readRepository.findByCriteria.mockResolvedValue(
      new PaginatedResult([], 0, 1, 1),
    );

    await handler.execute(
      new DeletePlantPhotoCommand({ id: PHOTO_ID, requestingUserId: OWNER_ID }),
    );

    expect(plantsPort.updateImageUrl).toHaveBeenCalledWith(
      PLANT_ID,
      null,
      OWNER_ID,
    );
  });

  it('does not touch imageUrl when the deleted photo was not the current one', async () => {
    const photo = buildPhoto();
    assertExistsService.execute.mockResolvedValue(photo);
    plantsPort.getImageUrl.mockResolvedValue('/api/files/other/content');

    await handler.execute(
      new DeletePlantPhotoCommand({ id: PHOTO_ID, requestingUserId: OWNER_ID }),
    );

    expect(plantsPort.updateImageUrl).not.toHaveBeenCalled();
  });

  it('throws PlantPhotoForbiddenException when the requester is not the uploader', async () => {
    const photo = buildPhoto();
    assertExistsService.execute.mockResolvedValue(photo);

    await expect(
      handler.execute(
        new DeletePlantPhotoCommand({
          id: PHOTO_ID,
          requestingUserId: OTHER_USER_ID,
        }),
      ),
    ).rejects.toThrow(PlantPhotoForbiddenException);

    expect(writeRepository.delete).not.toHaveBeenCalled();
    expect(filesPort.deleteFile).not.toHaveBeenCalled();
  });

  it('does not fail the deletion when the resync fails', async () => {
    const photo = buildPhoto();
    assertExistsService.execute.mockResolvedValue(photo);
    plantsPort.getImageUrl.mockRejectedValue(new Error('plants down'));

    await expect(
      handler.execute(
        new DeletePlantPhotoCommand({
          id: PHOTO_ID,
          requestingUserId: OWNER_ID,
        }),
      ),
    ).resolves.toBeUndefined();
    expect(writeRepository.delete).toHaveBeenCalledWith(PHOTO_ID);
  });
});
