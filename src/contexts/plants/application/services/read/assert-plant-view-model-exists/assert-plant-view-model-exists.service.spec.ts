import { PlantNotFoundException } from '@contexts/plants/domain/exceptions/plant-not-found.exception';
import { IPlantReadRepository } from '@contexts/plants/domain/repositories/read/plant-read.repository';
import { PlantIdValueObject } from '@contexts/plants/domain/value-objects/plant-id/plant-id.value-object';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';

import { AssertPlantViewModelExistsService } from './assert-plant-view-model-exists.service';

const PLANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const buildViewModel = (): PlantViewModel =>
  new PlantViewModel({
    id: PLANT_ID,
    name: 'Rose',
    species: null,
    imageUrl: null,
    userId: USER_ID,
    spaceId: SPACE_ID,
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('AssertPlantViewModelExistsService', () => {
  let service: AssertPlantViewModelExistsService;
  let readRepository: jest.Mocked<IPlantReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantReadRepository>;

    service = new AssertPlantViewModelExistsService(readRepository);
  });

  describe('plant exists', () => {
    it('should return PlantViewModel when found', async () => {
      const viewModel = buildViewModel();
      const id = new PlantIdValueObject(PLANT_ID);
      readRepository.findById.mockResolvedValue(viewModel);

      const result = await service.execute(id);

      expect(result).toBe(viewModel);
      expect(readRepository.findById).toHaveBeenCalledWith(id.value);
    });
  });

  describe('plant does not exist', () => {
    it('should throw PlantNotFoundException when not found', async () => {
      const id = new PlantIdValueObject(PLANT_ID);
      readRepository.findById.mockResolvedValue(null);

      await expect(service.execute(id)).rejects.toThrow(PlantNotFoundException);
    });

    it('should include plant id in exception message', async () => {
      const id = new PlantIdValueObject(PLANT_ID);
      readRepository.findById.mockResolvedValue(null);

      await expect(service.execute(id)).rejects.toThrow(PLANT_ID);
    });
  });
});
