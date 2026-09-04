import { HarvestNotFoundException } from '@contexts/harvests/domain/exceptions/harvest-not-found.exception';
import { IHarvestReadRepository } from '@contexts/harvests/domain/repositories/read/harvest-read.repository';

import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
import { AssertHarvestViewModelExistsService } from './assert-harvest-view-model-exists.service';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AssertHarvestViewModelExistsService', () => {
  let service: AssertHarvestViewModelExistsService;
  let readRepository: jest.Mocked<IHarvestReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IHarvestReadRepository>;
    service = new AssertHarvestViewModelExistsService(readRepository);
  });

  it('returns the view model when it exists', async () => {
    const vm = {} as HarvestViewModel;
    readRepository.findById.mockResolvedValue(vm);

    const result = await service.execute(new UuidValueObject(ID));

    expect(result).toBe(vm);
    expect(readRepository.findById).toHaveBeenCalledWith(ID);
  });

  it('throws HarvestNotFoundException when it does not exist', async () => {
    readRepository.findById.mockResolvedValue(null);

    await expect(service.execute(new UuidValueObject(ID))).rejects.toThrow(
      HarvestNotFoundException,
    );
  });
});
