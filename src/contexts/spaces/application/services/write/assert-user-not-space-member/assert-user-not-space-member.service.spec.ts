import { DuplicateMembershipException } from '@contexts/spaces/domain/exceptions/duplicate-membership.exception';
import { IMembershipReadRepository } from '@contexts/spaces/domain/repositories/read/membership-read.repository';
import { AssertUserNotSpaceMemberService } from './assert-user-not-space-member.service';

const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

describe('AssertUserNotSpaceMemberService', () => {
  let service: AssertUserNotSpaceMemberService;
  let readRepository: jest.Mocked<IMembershipReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    readRepository = {
      findByCriteria: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<IMembershipReadRepository>;
    service = new AssertUserNotSpaceMemberService(readRepository);
  });

  it('resolves when no membership exists for the user/space pair', async () => {
    readRepository.findByCriteria.mockResolvedValue({
      total: 0,
      items: [],
    } as never);

    await expect(
      service.execute({ userId: USER_ID, spaceId: SPACE_ID }),
    ).resolves.toBeUndefined();
  });

  it('throws DuplicateMembershipException when a membership already exists', async () => {
    readRepository.findByCriteria.mockResolvedValue({
      total: 1,
      items: [{}],
    } as never);

    await expect(
      service.execute({ userId: USER_ID, spaceId: SPACE_ID }),
    ).rejects.toThrow(DuplicateMembershipException);
  });
});
