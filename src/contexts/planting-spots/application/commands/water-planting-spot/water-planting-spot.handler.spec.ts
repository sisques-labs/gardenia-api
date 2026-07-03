import { IPlantingSpotPlantsPort } from '@contexts/planting-spots/application/ports/planting-spot-plants.port';
import { IWaterPlantPort } from '@contexts/planting-spots/application/ports/water-plant.port';
import { AssertPlantingSpotExistsService } from '@contexts/planting-spots/application/services/write/assert-planting-spot-exists/assert-planting-spot-exists.service';
import { PlantingSpotAggregate } from '@contexts/planting-spots/domain/aggregates/planting-spot.aggregate';
import { PlantingSpotNotFoundException } from '@contexts/planting-spots/domain/exceptions/planting-spot-not-found.exception';
import { PlantingSpotPlantViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot-plant.view-model';

import { WaterPlantingSpotCommand } from './water-planting-spot.command';
import { WaterPlantingSpotCommandHandler } from './water-planting-spot.handler';

const SPOT_ID = 'aa0e8400-e29b-41d4-a716-446655440005';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2026-06-27T00:00:00.000Z');

function plant(id: string): PlantingSpotPlantViewModel {
  return new PlantingSpotPlantViewModel({
    id,
    name: 'Basil',
    plantSpeciesId: null,
    imageUrl: null,
    userId: USER_ID,
    spaceId: SPACE_ID,
    createdAt: NOW,
    updatedAt: NOW,
  });
}

describe('WaterPlantingSpotCommandHandler', () => {
  let handler: WaterPlantingSpotCommandHandler;
  let mockPlantingSpotPlantsPort: jest.Mocked<IPlantingSpotPlantsPort>;
  let mockWaterPlantPort: jest.Mocked<IWaterPlantPort>;
  let mockAssert: jest.Mocked<AssertPlantingSpotExistsService>;

  beforeEach(() => {
    mockPlantingSpotPlantsPort = {
      findByPlantingSpotId: jest.fn(),
    } as jest.Mocked<IPlantingSpotPlantsPort>;

    mockWaterPlantPort = {
      waterPlant: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<IWaterPlantPort>;

    mockAssert = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertPlantingSpotExistsService>;

    handler = new WaterPlantingSpotCommandHandler(
      mockPlantingSpotPlantsPort,
      mockWaterPlantPort,
      mockAssert,
    );
  });

  it('waters every plant of the planting spot successfully', async () => {
    mockAssert.execute.mockResolvedValue(
      {} as unknown as PlantingSpotAggregate,
    );
    mockPlantingSpotPlantsPort.findByPlantingSpotId.mockResolvedValue([
      plant('p1'),
      plant('p2'),
      plant('p3'),
    ]);

    const result = await handler.execute(
      new WaterPlantingSpotCommand({
        plantingSpotId: SPOT_ID,
        userId: USER_ID,
        spaceId: SPACE_ID,
        performedAt: NOW,
      }),
    );

    expect(mockWaterPlantPort.waterPlant).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      plantingSpotId: SPOT_ID,
      wateredPlantIds: ['p1', 'p2', 'p3'],
      failedPlants: [],
    });
  });

  it('returns empty arrays when the planting spot has no plants', async () => {
    mockAssert.execute.mockResolvedValue(
      {} as unknown as PlantingSpotAggregate,
    );
    mockPlantingSpotPlantsPort.findByPlantingSpotId.mockResolvedValue([]);

    const result = await handler.execute(
      new WaterPlantingSpotCommand({
        plantingSpotId: SPOT_ID,
        userId: USER_ID,
        spaceId: SPACE_ID,
      }),
    );

    expect(mockWaterPlantPort.waterPlant).not.toHaveBeenCalled();
    expect(result).toEqual({
      plantingSpotId: SPOT_ID,
      wateredPlantIds: [],
      failedPlants: [],
    });
  });

  it('reports partial failures without throwing (best-effort)', async () => {
    mockAssert.execute.mockResolvedValue(
      {} as unknown as PlantingSpotAggregate,
    );
    mockPlantingSpotPlantsPort.findByPlantingSpotId.mockResolvedValue([
      plant('p1'),
      plant('p2'),
      plant('p3'),
    ]);
    mockWaterPlantPort.waterPlant.mockImplementation((input) => {
      if (input.plantId === 'p2') {
        return Promise.reject(new Error('boom'));
      }
      return Promise.resolve(undefined);
    });

    const result = await handler.execute(
      new WaterPlantingSpotCommand({
        plantingSpotId: SPOT_ID,
        userId: USER_ID,
        spaceId: SPACE_ID,
        performedAt: NOW,
      }),
    );

    expect(result.wateredPlantIds).toEqual(['p1', 'p3']);
    expect(result.failedPlants).toEqual([{ plantId: 'p2', reason: 'boom' }]);
  });

  it('propagates the exception without watering anything when the spot does not exist', async () => {
    mockAssert.execute.mockRejectedValue(
      new PlantingSpotNotFoundException(SPOT_ID),
    );

    await expect(
      handler.execute(
        new WaterPlantingSpotCommand({
          plantingSpotId: SPOT_ID,
          userId: USER_ID,
          spaceId: SPACE_ID,
        }),
      ),
    ).rejects.toThrow(PlantingSpotNotFoundException);

    expect(
      mockPlantingSpotPlantsPort.findByPlantingSpotId,
    ).not.toHaveBeenCalled();
    expect(mockWaterPlantPort.waterPlant).not.toHaveBeenCalled();
  });
});
