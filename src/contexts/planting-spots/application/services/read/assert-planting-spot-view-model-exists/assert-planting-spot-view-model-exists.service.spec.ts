import { PlantingSpotNotFoundException } from '@contexts/planting-spots/domain/exceptions/planting-spot-not-found.exception';
import { IPlantingSpotReadRepository } from '@contexts/planting-spots/domain/repositories/read/planting-spot-read.repository';
import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { AssertPlantingSpotViewModelExistsService } from './assert-planting-spot-view-model-exists.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AssertPlantingSpotViewModelExistsService', () => {
  let service: AssertPlantingSpotViewModelExistsService;
  let readRepository: jest.Mocked<IPlantingSpotReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IPlantingSpotReadRepository>;
    service = new AssertPlantingSpotViewModelExistsService(readRepository);
  });

  it('returns the view model when it exists', async () => {
    const vm = {} as PlantingSpotViewModel;
    readRepository.findById.mockResolvedValue(vm);

    const result = await service.execute(new PlantingSpotIdValueObject(ID));

    expect(result).toBe(vm);
    expect(readRepository.findById).toHaveBeenCalledWith(ID);
  });

  it('throws PlantingSpotNotFoundException when it does not exist', async () => {
    readRepository.findById.mockResolvedValue(null);

    await expect(
      service.execute(new PlantingSpotIdValueObject(ID)),
    ).rejects.toThrow(PlantingSpotNotFoundException);
  });
});
