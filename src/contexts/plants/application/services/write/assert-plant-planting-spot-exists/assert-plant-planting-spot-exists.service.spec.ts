import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { IPlantingSpotPort } from '@contexts/plants/application/ports/planting-spot.port';
import { PlantPlantingSpotNotFoundException } from '@contexts/plants/domain/exceptions/plant-planting-spot-not-found.exception';
import { AssertPlantPlantingSpotExistsService } from './assert-plant-planting-spot-exists.service';

const SPOT_ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440001';

describe('AssertPlantPlantingSpotExistsService', () => {
  let service: AssertPlantPlantingSpotExistsService;
  let plantingSpotPort: jest.Mocked<IPlantingSpotPort>;

  beforeEach(() => {
    jest.clearAllMocks();
    plantingSpotPort = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IPlantingSpotPort>;
    service = new AssertPlantPlantingSpotExistsService(plantingSpotPort);
  });

  it('resolves when the planting spot exists in the space', async () => {
    plantingSpotPort.findById.mockResolvedValue({ id: SPOT_ID } as never);

    await expect(
      service.execute(new UuidValueObject(SPOT_ID), SPACE_ID),
    ).resolves.toBeUndefined();
    expect(plantingSpotPort.findById).toHaveBeenCalledWith(SPOT_ID, SPACE_ID);
  });

  it('throws PlantPlantingSpotNotFoundException when the spot is missing', async () => {
    plantingSpotPort.findById.mockResolvedValue(null);

    await expect(
      service.execute(new UuidValueObject(SPOT_ID), SPACE_ID),
    ).rejects.toThrow(PlantPlantingSpotNotFoundException);
  });
});
