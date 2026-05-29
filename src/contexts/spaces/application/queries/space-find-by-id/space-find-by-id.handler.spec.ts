import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
import { ISpaceReadRepository } from '@contexts/spaces/domain/repositories/read/space-read.repository';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';

import { SpaceFindByIdQuery } from './space-find-by-id.query';
import { SpaceFindByIdQueryHandler } from './space-find-by-id.handler';

const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';
const NOW = new Date('2024-01-01T00:00:00.000Z');

describe('SpaceFindByIdQueryHandler', () => {
  let handler: SpaceFindByIdQueryHandler;
  let spaceReadRepository: jest.Mocked<ISpaceReadRepository>;
  let spaceViewModel: SpaceViewModel;

  beforeEach(() => {
    jest.clearAllMocks();

    spaceViewModel = new SpaceViewModel({
      id: SPACE_ID,
      name: 'Test Space',
      ownerId: OWNER_ID,
      createdAt: NOW,
      updatedAt: NOW,
    });

    spaceReadRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ISpaceReadRepository>;

    handler = new SpaceFindByIdQueryHandler(spaceReadRepository);
  });

  describe('found', () => {
    it('should return the space view model when it exists', async () => {
      spaceReadRepository.findById.mockResolvedValue(spaceViewModel);

      const result = await handler.execute(
        new SpaceFindByIdQuery({ spaceId: SPACE_ID }),
      );

      expect(result).toBe(spaceViewModel);
      expect(spaceReadRepository.findById).toHaveBeenCalledWith(SPACE_ID);
    });
  });

  describe('not found', () => {
    it('should throw SpaceNotFoundException when space does not exist', async () => {
      spaceReadRepository.findById.mockResolvedValue(null);

      await expect(
        handler.execute(new SpaceFindByIdQuery({ spaceId: SPACE_ID })),
      ).rejects.toThrow(SpaceNotFoundException);
    });
  });
});
