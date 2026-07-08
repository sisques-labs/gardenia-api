import { EventBus } from '@nestjs/cqrs';

import { IFilesPort } from '@contexts/plant-photos/application/ports/files.port';
import { IPlantsPort } from '@contexts/plant-photos/application/ports/plants.port';
import { PlantPhotoBuilder } from '@contexts/plant-photos/domain/builders/plant-photo.builder';
import { IPlantPhotoWriteRepository } from '@contexts/plant-photos/domain/repositories/write/plant-photo-write.repository';
import { UploadPlantPhotoCommand } from './upload-plant-photo.command';
import { UploadPlantPhotoCommandHandler } from './upload-plant-photo.handler';

const PLANT_ID = '440e8400-e29b-41d4-a716-446655440003';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const FILE_ID = '330e8400-e29b-41d4-a716-446655440004';
const FILE_URL = '/api/files/330e8400/content';

describe('UploadPlantPhotoCommandHandler', () => {
  let handler: UploadPlantPhotoCommandHandler;
  let mockWriteRepo: jest.Mocked<IPlantPhotoWriteRepository>;
  let mockFilesPort: jest.Mocked<IFilesPort>;
  let mockPlantsPort: jest.Mocked<IPlantsPort>;
  let mockEventBus: jest.Mocked<EventBus>;

  function buildCommand(): UploadPlantPhotoCommand {
    return new UploadPlantPhotoCommand({
      plantId: PLANT_ID,
      filename: 'rose.png',
      mimeType: 'image/png',
      size: 1024,
      content: Buffer.from('binary-content'),
      userId: USER_ID,
      spaceId: SPACE_ID,
    });
  }

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn().mockImplementation((agg) => Promise.resolve(agg)),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantPhotoWriteRepository>;

    mockFilesPort = {
      uploadFile: jest.fn().mockResolvedValue({ id: FILE_ID, url: FILE_URL }),
      deleteFile: jest.fn(),
    };

    mockPlantsPort = {
      getImageUrl: jest.fn(),
      updateImageUrl: jest.fn().mockResolvedValue(undefined),
    };

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new UploadPlantPhotoCommandHandler(
      mockWriteRepo,
      mockFilesPort,
      mockPlantsPort,
      new PlantPhotoBuilder(),
      mockEventBus,
    );
  });

  it('uploads via the files port, saves the association, and returns the result', async () => {
    const result = await handler.execute(buildCommand());

    expect(mockFilesPort.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'rose.png', mimeType: 'image/png' }),
    );
    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);
    expect(result.fileId).toBe(FILE_ID);
    expect(result.url).toBe(FILE_URL);
    expect(result.plantId).toBe(PLANT_ID);
    expect(result.id).toHaveLength(36);
  });

  it('syncs plants.imageUrl to the new photo url', async () => {
    await handler.execute(buildCommand());

    expect(mockPlantsPort.updateImageUrl).toHaveBeenCalledWith(
      PLANT_ID,
      FILE_URL,
      USER_ID,
    );
  });

  it('does not fail the upload when syncing plants.imageUrl rejects', async () => {
    mockPlantsPort.updateImageUrl.mockRejectedValue(new Error('plant gone'));

    await expect(handler.execute(buildCommand())).resolves.toMatchObject({
      fileId: FILE_ID,
    });
  });

  it('propagates the error and never saves when the files port rejects', async () => {
    mockFilesPort.uploadFile.mockRejectedValue(new Error('unsupported type'));

    await expect(handler.execute(buildCommand())).rejects.toThrow(
      'unsupported type',
    );
    expect(mockWriteRepo.save).not.toHaveBeenCalled();
  });
});
