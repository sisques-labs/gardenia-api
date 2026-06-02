import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { IPlantingSpotReadRepository } from '@contexts/planting-spots/domain/repositories/read/planting-spot-read.repository';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';

import { PlantingSpotFindByCriteriaQuery } from './planting-spot-find-by-criteria.query';
import { PlantingSpotFindByCriteriaQueryHandler } from './planting-spot-find-by-criteria.handler';

const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const buildViewModel = (type: string): PlantingSpotViewModel =>
  new PlantingSpotViewModel({
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Spot',
    type,
    description: null,
    userId: '550e8400-e29b-41d4-a716-446655440001',
    spaceId: SPACE_ID,
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('PlantingSpotFindByCriteriaQueryHandler', () => {
  let handler: PlantingSpotFindByCriteriaQueryHandler;
  let readRepository: jest.Mocked<IPlantingSpotReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
    } as jest.Mocked<IPlantingSpotReadRepository>;

    handler = new PlantingSpotFindByCriteriaQueryHandler(readRepository);
  });

  describe('returns spots scoped to spaceId', () => {
    it('should return all spots for the given space', async () => {
      const vm1 = buildViewModel(PlantingSpotTypeEnum.POT);
      const vm2 = buildViewModel(PlantingSpotTypeEnum.RAISED_BED);
      readRepository.findByCriteria.mockResolvedValue([vm1, vm2]);

      const query = new PlantingSpotFindByCriteriaQuery({
        spaceId: SPACE_ID,
      });
      const result = await handler.execute(query);

      expect(result).toHaveLength(2);
      expect(readRepository.findByCriteria).toHaveBeenCalledWith(
        expect.objectContaining({ spaceId: SPACE_ID }),
      );
    });
  });

  describe('type filter', () => {
    it('should pass type filter to repository', async () => {
      const vm1 = buildViewModel(PlantingSpotTypeEnum.POT);
      readRepository.findByCriteria.mockResolvedValue([vm1]);

      const query = new PlantingSpotFindByCriteriaQuery({
        spaceId: SPACE_ID,
        type: PlantingSpotTypeEnum.POT,
      });
      const result = await handler.execute(query);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(PlantingSpotTypeEnum.POT);
      expect(readRepository.findByCriteria).toHaveBeenCalledWith(
        expect.objectContaining({ type: PlantingSpotTypeEnum.POT }),
      );
    });
  });

  describe('empty result', () => {
    it('should return empty array without throwing when no spots found', async () => {
      readRepository.findByCriteria.mockResolvedValue([]);

      const query = new PlantingSpotFindByCriteriaQuery({ spaceId: SPACE_ID });
      const result = await handler.execute(query);

      expect(result).toEqual([]);
      expect(readRepository.findByCriteria).toHaveBeenCalledTimes(1);
    });
  });
});
