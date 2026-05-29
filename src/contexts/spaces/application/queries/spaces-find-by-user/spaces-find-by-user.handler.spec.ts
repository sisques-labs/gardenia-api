import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { ISpaceReadRepository } from '@contexts/spaces/domain/repositories/read/space-read.repository';

import { SpacesFindByUserQuery } from './spaces-find-by-user.query';
import { SpacesFindByUserQueryHandler } from './spaces-find-by-user.handler';

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const ANOTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440002';

describe('SpacesFindByUserQueryHandler', () => {
  let handler: SpacesFindByUserQueryHandler;
  let spaceReadRepository: jest.Mocked<ISpaceReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    spaceReadRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
    } as jest.Mocked<ISpaceReadRepository>;

    handler = new SpacesFindByUserQueryHandler(spaceReadRepository);
  });

  describe('empty list', () => {
    it('should return an empty array when user has no spaces', async () => {
      spaceReadRepository.findByUserId.mockResolvedValue([]);

      const result = await handler.execute(new SpacesFindByUserQuery(USER_ID));

      expect(result).toEqual([]);
      expect(spaceReadRepository.findByUserId).toHaveBeenCalledWith(USER_ID);
    });
  });

  describe('multiple results', () => {
    it('should return all spaces the user belongs to', async () => {
      const space1 = SpaceAggregate.create(USER_ID, 'Space 1');
      const space2 = SpaceAggregate.create(ANOTHER_USER_ID, 'Space 2');
      spaceReadRepository.findByUserId.mockResolvedValue([space1, space2]);

      const result = await handler.execute(new SpacesFindByUserQuery(USER_ID));

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(space1);
      expect(result[1]).toBe(space2);
    });
  });
});
