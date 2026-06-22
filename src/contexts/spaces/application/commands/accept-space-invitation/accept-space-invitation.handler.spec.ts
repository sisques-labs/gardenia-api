import { EventBus } from '@nestjs/cqrs';

import { AssertSpaceInvitationViewModelExistsByCodeService } from '@contexts/spaces/application/services/read/assert-space-invitation-view-model-exists-by-code/assert-space-invitation-view-model-exists-by-code.service';
import { AssertSpaceExistsService } from '@contexts/spaces/application/services/write/assert-space-exists/assert-space-exists.service';
import { AssertSpaceInvitationNotExpiredService } from '@contexts/spaces/application/services/write/assert-space-invitation-not-expired/assert-space-invitation-not-expired.service';
import { AssertUserNotSpaceMemberService } from '@contexts/spaces/application/services/write/assert-user-not-space-member/assert-user-not-space-member.service';
import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { DuplicateMembershipException } from '@contexts/spaces/domain/exceptions/duplicate-membership.exception';
import { ISpaceWriteRepository } from '@contexts/spaces/domain/repositories/write/space-write.repository';
import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';
import { AcceptSpaceInvitationCommand } from './accept-space-invitation.command';
import { AcceptSpaceInvitationCommandHandler } from './accept-space-invitation.handler';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const CODE = 'SECRETCODE';

const invitationVm = (): SpaceInvitationViewModel =>
  ({
    spaceId: SPACE_ID,
    role: 'member',
    code: CODE,
  }) as SpaceInvitationViewModel;

describe('AcceptSpaceInvitationCommandHandler', () => {
  let handler: AcceptSpaceInvitationCommandHandler;
  let assertInvitationExists: jest.Mocked<AssertSpaceInvitationViewModelExistsByCodeService>;
  let assertNotExpired: jest.Mocked<AssertSpaceInvitationNotExpiredService>;
  let assertNotMember: jest.Mocked<AssertUserNotSpaceMemberService>;
  let assertSpaceExists: jest.Mocked<AssertSpaceExistsService>;
  let writeRepository: jest.Mocked<ISpaceWriteRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let space: jest.Mocked<SpaceAggregate>;

  beforeEach(() => {
    jest.clearAllMocks();

    space = {
      addMember: jest.fn(),
      getUncommittedEvents: jest.fn().mockReturnValue([]),
      commit: jest.fn(),
    } as unknown as jest.Mocked<SpaceAggregate>;

    assertInvitationExists = {
      execute: jest.fn().mockResolvedValue(invitationVm()),
    } as unknown as jest.Mocked<AssertSpaceInvitationViewModelExistsByCodeService>;
    assertNotExpired = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AssertSpaceInvitationNotExpiredService>;
    assertNotMember = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AssertUserNotSpaceMemberService>;
    assertSpaceExists = {
      execute: jest.fn().mockResolvedValue(space),
    } as unknown as jest.Mocked<AssertSpaceExistsService>;
    writeRepository = {
      save: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<ISpaceWriteRepository>;
    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new AcceptSpaceInvitationCommandHandler(
      assertInvitationExists,
      assertNotExpired,
      assertNotMember,
      assertSpaceExists,
      writeRepository,
      eventBus,
    );
  });

  const command = (): AcceptSpaceInvitationCommand =>
    new AcceptSpaceInvitationCommand({ code: CODE, acceptingUserId: USER_ID });

  it('adds the member, saves, publishes and returns the space id', async () => {
    const result = await handler.execute(command());

    expect(assertNotExpired.execute).toHaveBeenCalledTimes(1);
    expect(space.addMember).toHaveBeenCalledWith(USER_ID, 'member');
    expect(writeRepository.save).toHaveBeenCalledWith(space);
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    expect(result).toBe(SPACE_ID);
  });

  it('is idempotent: returns the space id without saving when already a member', async () => {
    assertNotMember.execute.mockRejectedValue(
      new DuplicateMembershipException(USER_ID, SPACE_ID),
    );

    const result = await handler.execute(command());

    expect(result).toBe(SPACE_ID);
    expect(assertSpaceExists.execute).not.toHaveBeenCalled();
    expect(writeRepository.save).not.toHaveBeenCalled();
  });

  it('propagates when the invitation is expired', async () => {
    assertNotExpired.execute.mockRejectedValue(new Error('expired'));

    await expect(handler.execute(command())).rejects.toThrow('expired');
    expect(writeRepository.save).not.toHaveBeenCalled();
  });

  it('rethrows non-duplicate errors from the membership check', async () => {
    assertNotMember.execute.mockRejectedValue(new Error('boom'));

    await expect(handler.execute(command())).rejects.toThrow('boom');
    expect(writeRepository.save).not.toHaveBeenCalled();
  });
});
