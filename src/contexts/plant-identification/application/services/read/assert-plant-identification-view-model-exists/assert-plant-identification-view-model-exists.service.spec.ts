import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationNotFoundException } from '@contexts/plant-identification/domain/exceptions/plant-identification-not-found.exception';
import { IPlantIdentificationReadRepository } from '@contexts/plant-identification/domain/repositories/read/plant-identification-read.repository';
import { PlantIdentificationIdValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-id/plant-identification-id.value-object';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';
import { AssertPlantIdentificationViewModelExistsService } from './assert-plant-identification-view-model-exists.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

function buildViewModel(): PlantIdentificationViewModel {
  return new PlantIdentificationViewModel({
    id: ID,
    requestedByUserId: '660e8400-e29b-41d4-a716-446655440001',
    spaceId: '770e8400-e29b-41d4-a716-446655440002',
    status: PlantIdentificationStatusEnum.RESOLVED,
    resolvedGbifKey: 2882337,
    resolvedScientificName: 'Monstera deliciosa',
    convertedToPlantId: null,
    photos: [],
    candidates: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('AssertPlantIdentificationViewModelExistsService', () => {
  let mockReadRepo: jest.Mocked<IPlantIdentificationReadRepository>;
  let service: AssertPlantIdentificationViewModelExistsService;

  beforeEach(() => {
    mockReadRepo = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    service = new AssertPlantIdentificationViewModelExistsService(mockReadRepo);
  });

  it('returns the view model when found', async () => {
    const vm = buildViewModel();
    mockReadRepo.findById.mockResolvedValue(vm);

    const result = await service.execute(
      new PlantIdentificationIdValueObject(ID),
    );
    expect(result).toBe(vm);
  });

  it('throws PlantIdentificationNotFoundException when not found', async () => {
    mockReadRepo.findById.mockResolvedValue(null);

    await expect(
      service.execute(new PlantIdentificationIdValueObject(ID)),
    ).rejects.toThrow(PlantIdentificationNotFoundException);
  });
});
