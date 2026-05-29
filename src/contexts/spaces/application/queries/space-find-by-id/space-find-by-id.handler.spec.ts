import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
import { ISpaceReadRepository } from '@contexts/spaces/domain/repositories/read/space-read.repository';

import { SpaceFindByIdQuery } from './space-find-by-id.query';
import { SpaceFindByIdQueryHandler } from './space-find-by-id.handler';

const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('SpaceFindByIdQueryHandler', () => {
  let handler: SpaceFindByIdQueryHandler;
  let spaceReadRepository: jest.Mocked<ISpaceReadRepository>;
  let space: SpaceAggregate;

  beforeEach(() => {
    jest.clearAllMocks();

    space = SpaceAggregate.create(OWNER_ID, 'Test Space');

    spaceReadRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
    } as jest.Mocked<ISpaceReadRepository>;

    handler = new SpaceFindByIdQueryHandler(spaceReadRepository);
  });

  describe('found', () => {
    it('should return the space when it exists', async () => {
      spaceReadRepository.findById.mockResolvedValue(space);

      const result = await handler.execute(
        new SpaceFindByIdQuery(space.id.value),
      );

      expect(result).toBe(space);
      expect(spaceReadRepository.findById).toHaveBeenCalledWith(space.id.value);
    });
  });

  describe('not found', () => {
    it('should throw SpaceNotFoundException when space does not exist', async () => {
      spaceReadRepository.findById.mockResolvedValue(null);

      await expect(
        handler.execute(new SpaceFindByIdQuery(SPACE_ID)),
      ).rejects.toThrow(SpaceNotFoundException);
    });
  });
});
