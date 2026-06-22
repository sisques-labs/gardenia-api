import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';
import { NotASpaceMemberException } from '@contexts/spaces/domain/exceptions/not-a-space-member.exception';
import { IMembershipReadRepository } from '@contexts/spaces/domain/repositories/read/membership-read.repository';
import { AssertUserIsSpaceMemberService } from './assert-user-is-space-member.service';

const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

describe('AssertUserIsSpaceMemberService', () => {
  let service: AssertUserIsSpaceMemberService;
  let readRepository: jest.Mocked<IMembershipReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    readRepository = {
      findByCriteria: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<IMembershipReadRepository>;
    service = new AssertUserIsSpaceMemberService(readRepository);
  });

  it('returns the membership when the user is a member', async () => {
    const membership = { id: 'm1' } as unknown as SpaceMembership;
    readRepository.findByCriteria.mockResolvedValue({
      total: 1,
      items: [membership],
    } as never);

    const result = await service.execute({
      userId: USER_ID,
      spaceId: SPACE_ID,
    });

    expect(result).toBe(membership);
  });

  it('throws NotASpaceMemberException when no membership exists', async () => {
    readRepository.findByCriteria.mockResolvedValue({
      total: 0,
      items: [],
    } as never);

    await expect(
      service.execute({ userId: USER_ID, spaceId: SPACE_ID }),
    ).rejects.toThrow(NotASpaceMemberException);
  });
});
