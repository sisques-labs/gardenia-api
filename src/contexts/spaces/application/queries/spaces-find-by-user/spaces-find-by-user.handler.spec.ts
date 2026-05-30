import { ISpaceReadRepository } from '@contexts/spaces/domain/repositories/read/space-read.repository';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';

import { SpacesFindByUserQuery } from './spaces-find-by-user.query';
import { SpacesFindByUserQueryHandler } from './spaces-find-by-user.handler';

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const ANOTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01T00:00:00.000Z');

describe('SpacesFindByUserQueryHandler', () => {
  let handler: SpacesFindByUserQueryHandler;
  let spaceReadRepository: jest.Mocked<ISpaceReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    spaceReadRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      findByMember: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ISpaceReadRepository>;

    handler = new SpacesFindByUserQueryHandler(spaceReadRepository);
  });

  describe('empty list', () => {
    it('should return an empty paginated result when user has no spaces', async () => {
      spaceReadRepository.findByMember.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 1,
      } as any);

      const result = await handler.execute(
        new SpacesFindByUserQuery({ userId: USER_ID }),
      );

      expect(result.items).toEqual([]);
      expect(spaceReadRepository.findByMember).toHaveBeenCalledTimes(1);
      expect(spaceReadRepository.findByMember).toHaveBeenCalledWith(USER_ID);
      expect(spaceReadRepository.findByCriteria).not.toHaveBeenCalled();
    });
  });

  describe('multiple results', () => {
    it('should return both owner-space and member-space for the user', async () => {
      const ownerSpace = new SpaceViewModel({
        id: '550e8400-e29b-41d4-a716-446655440010',
        name: 'My Own Space',
        ownerId: USER_ID,
        createdAt: NOW,
        updatedAt: NOW,
      });
      const memberSpace = new SpaceViewModel({
        id: '550e8400-e29b-41d4-a716-446655440011',
        name: 'Someone Elses Space',
        ownerId: ANOTHER_USER_ID,
        createdAt: NOW,
        updatedAt: NOW,
      });

      spaceReadRepository.findByMember.mockResolvedValue({
        items: [ownerSpace, memberSpace],
        total: 2,
        page: 1,
        perPage: 2,
      } as any);

      const result = await handler.execute(
        new SpacesFindByUserQuery({ userId: USER_ID }),
      );

      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toBe(ownerSpace);
      expect(result.items[1]).toBe(memberSpace);
      expect(spaceReadRepository.findByMember).toHaveBeenCalledWith(USER_ID);
      expect(spaceReadRepository.findByCriteria).not.toHaveBeenCalled();
    });
  });
});
