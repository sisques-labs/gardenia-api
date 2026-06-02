import { PlantingSpotInUseException } from '@contexts/planting-spots/domain/exceptions/planting-spot-in-use.exception';
import { IPlantingSpotInUsePort } from '@contexts/planting-spots/application/ports/planting-spot-in-use.port';
import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';

import { AssertPlantingSpotNotInUseService } from './assert-planting-spot-not-in-use.service';

const SPOT_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AssertPlantingSpotNotInUseService', () => {
  let service: AssertPlantingSpotNotInUseService;
  let inUsePort: jest.Mocked<IPlantingSpotInUsePort>;

  beforeEach(() => {
    jest.clearAllMocks();

    inUsePort = {
      countByPlantingSpotId: jest.fn(),
    } as jest.Mocked<IPlantingSpotInUsePort>;

    service = new AssertPlantingSpotNotInUseService(inUsePort);
  });

  describe('count is 0 — spot is not in use', () => {
    it('should not throw when count is 0', async () => {
      inUsePort.countByPlantingSpotId.mockResolvedValue(0);

      await expect(
        service.execute(new PlantingSpotIdValueObject(SPOT_ID)),
      ).resolves.toBeUndefined();
    });
  });

  describe('count > 0 — spot is in use', () => {
    it('should throw PlantingSpotInUseException when count is 1', async () => {
      inUsePort.countByPlantingSpotId.mockResolvedValue(1);

      await expect(
        service.execute(new PlantingSpotIdValueObject(SPOT_ID)),
      ).rejects.toThrow(PlantingSpotInUseException);
    });

    it('should throw PlantingSpotInUseException when count is greater than 1', async () => {
      inUsePort.countByPlantingSpotId.mockResolvedValue(5);

      await expect(
        service.execute(new PlantingSpotIdValueObject(SPOT_ID)),
      ).rejects.toThrow(PlantingSpotInUseException);
    });

    it('should include the spot id in the thrown exception', async () => {
      inUsePort.countByPlantingSpotId.mockResolvedValue(1);

      await expect(
        service.execute(new PlantingSpotIdValueObject(SPOT_ID)),
      ).rejects.toThrow(SPOT_ID);
    });
  });
});
