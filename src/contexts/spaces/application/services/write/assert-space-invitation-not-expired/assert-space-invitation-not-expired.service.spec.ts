import { InvitationExpiredException } from '@contexts/spaces/domain/exceptions/invitation-expired.exception';
import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';
import { AssertSpaceInvitationNotExpiredService } from './assert-space-invitation-not-expired.service';

describe('AssertSpaceInvitationNotExpiredService', () => {
  let service: AssertSpaceInvitationNotExpiredService;

  beforeEach(() => {
    service = new AssertSpaceInvitationNotExpiredService();
  });

  it('resolves when the invitation expires in the future', async () => {
    const invitation = {
      code: 'SECRETCODE',
      expiresAt: new Date(Date.now() + 60_000),
    } as SpaceInvitationViewModel;

    await expect(service.execute(invitation)).resolves.toBeUndefined();
  });

  it('throws InvitationExpiredException when the invitation already expired', async () => {
    const invitation = {
      code: 'SECRETCODE',
      expiresAt: new Date(Date.now() - 60_000),
    } as SpaceInvitationViewModel;

    await expect(service.execute(invitation)).rejects.toThrow(
      InvitationExpiredException,
    );
  });
});
