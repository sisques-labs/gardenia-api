import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotNotFoundException } from '@contexts/planting-spots/domain/exceptions/planting-spot-not-found.exception';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { AssertPlantingSpotViewModelExistsService } from '../../services/read/assert-planting-spot-view-model-exists/assert-planting-spot-view-model-exists.service';

import { PlantingSpotFindByIdQueryHandler } from './planting-spot-find-by-id.handler';
import { PlantingSpotFindByIdQuery } from './planting-spot-find-by-id.query';

const SPOT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const buildViewModel = (): PlantingSpotViewModel =>
  new PlantingSpotViewModel({
    id: SPOT_ID,
    name: 'Bancal Norte',
    type: PlantingSpotTypeEnum.RAISED_BED,
    description: null,
    userId: USER_ID,
    spaceId: SPACE_ID,
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('PlantingSpotFindByIdQueryHandler', () => {
  let handler: PlantingSpotFindByIdQueryHandler;
  let assertService: jest.Mocked<AssertPlantingSpotViewModelExistsService>;

  beforeEach(() => {
    jest.clearAllMocks();

    assertService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertPlantingSpotViewModelExistsService>;

    handler = new PlantingSpotFindByIdQueryHandler(assertService);
  });

  describe('spot found', () => {
    it('should return PlantingSpotViewModel when spot exists in the space', async () => {
      const viewModel = buildViewModel();
      assertService.execute.mockResolvedValue(viewModel);

      const query = new PlantingSpotFindByIdQuery({ id: SPOT_ID });
      const result = await handler.execute(query);

      expect(result).toBe(viewModel);
      expect(assertService.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('spot not found', () => {
    it('should propagate PlantingSpotNotFoundException', async () => {
      assertService.execute.mockRejectedValue(
        new PlantingSpotNotFoundException(SPOT_ID),
      );

      const query = new PlantingSpotFindByIdQuery({ id: SPOT_ID });

      await expect(handler.execute(query)).rejects.toThrow(
        PlantingSpotNotFoundException,
      );
    });
  });
});
