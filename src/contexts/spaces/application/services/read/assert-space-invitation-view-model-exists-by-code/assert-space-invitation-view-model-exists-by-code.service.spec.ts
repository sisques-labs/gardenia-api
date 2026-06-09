import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { InvitationNotFoundException } from '@contexts/spaces/domain/exceptions/invitation-not-found.exception';
import { ISpaceInvitationReadRepository } from '@contexts/spaces/domain/repositories/read/space-invitation-read.repository';
import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';

import { AssertSpaceInvitationViewModelExistsByCodeService } from './assert-space-invitation-view-model-exists-by-code.service';

const CODE = 'LIM2026AB';

const buildViewModel = (): SpaceInvitationViewModel =>
  new SpaceInvitationViewModel({
    id: '550e8400-e29b-41d4-a716-446655440000',
    spaceId: '550e8400-e29b-41d4-a716-446655440001',
    createdByUserId: '550e8400-e29b-41d4-a716-446655440002',
    role: MembershipRoleEnum.MEMBER,
    code: CODE,
    displayCode: 'LIM · 2026 · AB',
    qrId: null,
    expiresAt: new Date('2026-12-31'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });

describe('AssertSpaceInvitationViewModelExistsByCodeService', () => {
  let service: AssertSpaceInvitationViewModelExistsByCodeService;
  let readRepository: jest.Mocked<ISpaceInvitationReadRepository>;

  beforeEach(() => {
    readRepository = {
      findByCode: jest.fn(),
    } as unknown as jest.Mocked<ISpaceInvitationReadRepository>;

    service = new AssertSpaceInvitationViewModelExistsByCodeService(
      readRepository,
    );
  });

  it('returns the invitation when found by code', async () => {
    const viewModel = buildViewModel();
    readRepository.findByCode.mockResolvedValue(viewModel);

    const result = await service.execute(CODE);

    expect(result).toBe(viewModel);
    expect(readRepository.findByCode).toHaveBeenCalledWith(CODE);
  });

  it('throws InvitationNotFoundException when code does not exist', async () => {
    readRepository.findByCode.mockResolvedValue(null);

    await expect(service.execute(CODE)).rejects.toThrow(
      InvitationNotFoundException,
    );
  });
});
