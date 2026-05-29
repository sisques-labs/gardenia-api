import { EventBus } from '@nestjs/cqrs';

import { AssertSpaceExistsService } from '@contexts/spaces/application/services/write/assert-space-exists/assert-space-exists.service';
import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { SpaceBuilder } from '@contexts/spaces/domain/builders/space.builder';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { DuplicateMembershipException } from '@contexts/spaces/domain/exceptions/duplicate-membership.exception';
import { NotASpaceMemberException } from '@contexts/spaces/domain/exceptions/not-a-space-member.exception';
import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
import { ISpaceWriteRepository } from '@contexts/spaces/domain/repositories/write/space-write.repository';

import { AddMemberCommand } from './add-member.command';
import { AddMemberCommandHandler } from './add-member.handler';

const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';
const MEMBER_ID = '550e8400-e29b-41d4-a716-446655440002';
const NON_OWNER_ID = '550e8400-e29b-41d4-a716-446655440003';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';
const NOW = new Date('2024-01-01T00:00:00.000Z');

function buildSpace(): SpaceAggregate {
  const space = new SpaceBuilder()
    .withId(SPACE_ID)
    .withName('Test Space')
    .withOwnerId(OWNER_ID)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();
  space.addMember(OWNER_ID, MembershipRoleEnum.OWNER);
  return space;
}

describe('AddMemberCommandHandler', () => {
  let handler: AddMemberCommandHandler;
  let spaceWriteRepository: jest.Mocked<ISpaceWriteRepository>;
  let assertSpaceExistsService: jest.Mocked<AssertSpaceExistsService>;
  let eventBus: jest.Mocked<EventBus>;
  let space: SpaceAggregate;

  beforeEach(() => {
    jest.clearAllMocks();

    space = buildSpace();

    spaceWriteRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ISpaceWriteRepository>;

    assertSpaceExistsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertSpaceExistsService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new AddMemberCommandHandler(
      spaceWriteRepository,
      assertSpaceExistsService,
      eventBus,
    );
  });

  describe('happy path', () => {
    it('should add a member when requester is the owner', async () => {
      assertSpaceExistsService.execute.mockResolvedValue(space);
      spaceWriteRepository.save.mockResolvedValue(undefined as any);

      await handler.execute(
        new AddMemberCommand({
          spaceId: SPACE_ID,
          requestingUserId: OWNER_ID,
          targetUserId: MEMBER_ID,
        }),
      );

      expect(spaceWriteRepository.save).toHaveBeenCalledTimes(1);
      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('space not found', () => {
    it('should throw SpaceNotFoundException when space does not exist', async () => {
      assertSpaceExistsService.execute.mockRejectedValue(
        new SpaceNotFoundException(SPACE_ID),
      );

      await expect(
        handler.execute(
          new AddMemberCommand({
            spaceId: SPACE_ID,
            requestingUserId: OWNER_ID,
            targetUserId: MEMBER_ID,
          }),
        ),
      ).rejects.toThrow(SpaceNotFoundException);
    });
  });

  describe('authorization', () => {
    it('should throw NotASpaceMemberException when requester is not the owner', async () => {
      space.addMember(NON_OWNER_ID, MembershipRoleEnum.MEMBER);
      assertSpaceExistsService.execute.mockResolvedValue(space);

      await expect(
        handler.execute(
          new AddMemberCommand({
            spaceId: SPACE_ID,
            requestingUserId: NON_OWNER_ID,
            targetUserId: MEMBER_ID,
          }),
        ),
      ).rejects.toThrow(NotASpaceMemberException);
    });

    it('should throw NotASpaceMemberException when requester is not a member at all', async () => {
      assertSpaceExistsService.execute.mockResolvedValue(space);

      await expect(
        handler.execute(
          new AddMemberCommand({
            spaceId: SPACE_ID,
            requestingUserId: NON_OWNER_ID,
            targetUserId: MEMBER_ID,
          }),
        ),
      ).rejects.toThrow(NotASpaceMemberException);
    });
  });

  describe('duplicate member', () => {
    it('should throw DuplicateMembershipException when target is already a member', async () => {
      space.addMember(MEMBER_ID, MembershipRoleEnum.MEMBER);
      assertSpaceExistsService.execute.mockResolvedValue(space);

      await expect(
        handler.execute(
          new AddMemberCommand({
            spaceId: SPACE_ID,
            requestingUserId: OWNER_ID,
            targetUserId: MEMBER_ID,
          }),
        ),
      ).rejects.toThrow(DuplicateMembershipException);
    });
  });
});
