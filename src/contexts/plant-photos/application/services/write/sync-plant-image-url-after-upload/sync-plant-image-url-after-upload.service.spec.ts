import { IPlantsPort } from '@contexts/plant-photos/application/ports/plants.port';

import { SyncPlantImageUrlAfterUploadService } from './sync-plant-image-url-after-upload.service';

const PLANT_ID = '440e8400-e29b-41d4-a716-446655440003';
const OWNER_ID = '660e8400-e29b-41d4-a716-446655440001';
const URL = '/api/files/330e8400/content';

describe('SyncPlantImageUrlAfterUploadService', () => {
  let plantsPort: jest.Mocked<IPlantsPort>;
  let service: SyncPlantImageUrlAfterUploadService;

  beforeEach(() => {
    plantsPort = {
      getImageUrl: jest.fn().mockResolvedValue(URL),
      updateImageUrl: jest.fn().mockResolvedValue(undefined),
    };
    service = new SyncPlantImageUrlAfterUploadService(plantsPort);
  });

  it('syncs plants.imageUrl to the new photo url', async () => {
    await service.execute({
      plantId: PLANT_ID,
      url: URL,
      requestingUserId: OWNER_ID,
    });

    expect(plantsPort.updateImageUrl).toHaveBeenCalledWith(
      PLANT_ID,
      URL,
      OWNER_ID,
    );
  });

  it('does not throw when the sync fails', async () => {
    plantsPort.updateImageUrl.mockRejectedValue(new Error('plant gone'));

    await expect(
      service.execute({
        plantId: PLANT_ID,
        url: URL,
        requestingUserId: OWNER_ID,
      }),
    ).resolves.toBeUndefined();
  });
});
