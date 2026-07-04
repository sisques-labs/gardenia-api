import { AssertSpaceInvitationViewModelExistsByCodeService } from '@contexts/spaces/application/services/read/assert-space-invitation-view-model-exists-by-code/assert-space-invitation-view-model-exists-by-code.service';
import { AssertSpaceViewModelExistsService } from '@contexts/spaces/application/services/read/assert-space-view-model-exists/assert-space-view-model-exists.service';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { InvitationNotFoundException } from '@contexts/spaces/domain/exceptions/invitation-not-found.exception';
import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';

import { SpaceInvitationPreviewFindByCodeQuery } from './space-invitation-preview-find-by-code.query';
import { SpaceInvitationPreviewFindByCodeQueryHandler } from './space-invitation-preview-find-by-code.handler';

const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';
const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';
const INVITATION_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01T00:00:00.000Z');

describe('SpaceInvitationPreviewFindByCodeQueryHandler', () => {
  let handler: SpaceInvitationPreviewFindByCodeQueryHandler;
  let assertSpaceInvitationViewModelExistsByCodeService: jest.Mocked<AssertSpaceInvitationViewModelExistsByCodeService>;
  let assertSpaceViewModelExistsService: jest.Mocked<AssertSpaceViewModelExistsService>;

  const buildInvitation = (expiresAt: Date) =>
    new SpaceInvitationViewModel({
      id: INVITATION_ID,
      spaceId: SPACE_ID,
      createdByUserId: OWNER_ID,
      role: MembershipRoleEnum.MEMBER,
      code: 'GAR2026K7',
      displayCode: 'GAR · 2026 · K7',
      qrId: null,
      expiresAt,
      createdAt: NOW,
      updatedAt: NOW,
    });

  const buildSpace = () =>
    new SpaceViewModel({
      id: SPACE_ID,
      name: 'Greenhouse A',
      ownerId: OWNER_ID,
      latitude: null,
      longitude: null,
      environment: null,
      createdAt: NOW,
      updatedAt: NOW,
    });

  beforeEach(() => {
    jest.clearAllMocks();

    assertSpaceInvitationViewModelExistsByCodeService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertSpaceInvitationViewModelExistsByCodeService>;

    assertSpaceViewModelExistsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertSpaceViewModelExistsService>;

    handler = new SpaceInvitationPreviewFindByCodeQueryHandler(
      assertSpaceInvitationViewModelExistsByCodeService,
      assertSpaceViewModelExistsService,
    );
  });

  describe('valid, non-expired invitation', () => {
    it('should return the preview with isExpired: false', async () => {
      const futureExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      assertSpaceInvitationViewModelExistsByCodeService.execute.mockResolvedValue(
        buildInvitation(futureExpiry),
      );
      assertSpaceViewModelExistsService.execute.mockResolvedValue(buildSpace());

      const result = await handler.execute(
        new SpaceInvitationPreviewFindByCodeQuery({ code: 'GAR2026K7' }),
      );

      expect(result).toEqual({
        spaceName: 'Greenhouse A',
        role: MembershipRoleEnum.MEMBER,
        expiresAt: futureExpiry,
        isExpired: false,
      });
    });
  });

  describe('expired invitation', () => {
    it('should return the preview with isExpired: true instead of throwing', async () => {
      const pastExpiry = new Date(NOW.getTime() - 60 * 1000);
      assertSpaceInvitationViewModelExistsByCodeService.execute.mockResolvedValue(
        buildInvitation(pastExpiry),
      );
      assertSpaceViewModelExistsService.execute.mockResolvedValue(buildSpace());

      const result = await handler.execute(
        new SpaceInvitationPreviewFindByCodeQuery({ code: 'GAR2026K7' }),
      );

      expect(result.isExpired).toBe(true);
    });
  });

  describe('unknown code', () => {
    it('should propagate InvitationNotFoundException', async () => {
      assertSpaceInvitationViewModelExistsByCodeService.execute.mockRejectedValue(
        new InvitationNotFoundException('UNKNOWN'),
      );

      await expect(
        handler.execute(
          new SpaceInvitationPreviewFindByCodeQuery({ code: 'UNKNOWN' }),
        ),
      ).rejects.toThrow(InvitationNotFoundException);

      expect(assertSpaceViewModelExistsService.execute).not.toHaveBeenCalled();
    });
  });

  describe('space deleted after invitation was created', () => {
    it('should propagate SpaceNotFoundException', async () => {
      assertSpaceInvitationViewModelExistsByCodeService.execute.mockResolvedValue(
        buildInvitation(new Date(Date.now() + 1000)),
      );
      assertSpaceViewModelExistsService.execute.mockRejectedValue(
        new SpaceNotFoundException(SPACE_ID),
      );

      await expect(
        handler.execute(
          new SpaceInvitationPreviewFindByCodeQuery({ code: 'GAR2026K7' }),
        ),
      ).rejects.toThrow(SpaceNotFoundException);
    });
  });
});
