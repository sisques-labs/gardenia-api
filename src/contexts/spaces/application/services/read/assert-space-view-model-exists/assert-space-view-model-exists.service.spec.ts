import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
import { ISpaceReadRepository } from '@contexts/spaces/domain/repositories/read/space-read.repository';
import { SpaceIdValueObject } from '@contexts/spaces/domain/value-objects/space-id/space-id.value-object';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';

import { AssertSpaceViewModelExistsService } from './assert-space-view-model-exists.service';

const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';
const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';

const buildViewModel = (): SpaceViewModel =>
  new SpaceViewModel({
    id: SPACE_ID,
    name: 'My Garden',
    ownerId: OWNER_ID,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

describe('AssertSpaceViewModelExistsService', () => {
  let service: AssertSpaceViewModelExistsService;
  let readRepository: jest.Mocked<ISpaceReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ISpaceReadRepository>;

    service = new AssertSpaceViewModelExistsService(readRepository);
  });

  describe('space exists', () => {
    it('should return the view model when read repository finds the space', async () => {
      const viewModel = buildViewModel();
      const id = new SpaceIdValueObject(SPACE_ID);
      readRepository.findById.mockResolvedValue(viewModel);

      const result = await service.execute(id);

      expect(result).toBe(viewModel);
      expect(readRepository.findById).toHaveBeenCalledWith(id.value);
    });
  });

  describe('space does not exist', () => {
    it('should throw SpaceNotFoundException when read repository returns null', async () => {
      const id = new SpaceIdValueObject(SPACE_ID);
      readRepository.findById.mockResolvedValue(null);

      await expect(service.execute(id)).rejects.toThrow(SpaceNotFoundException);
    });

    it('should include the space id in the thrown exception', async () => {
      const id = new SpaceIdValueObject(SPACE_ID);
      readRepository.findById.mockResolvedValue(null);

      await expect(service.execute(id)).rejects.toThrow(SPACE_ID);
    });
  });
});
