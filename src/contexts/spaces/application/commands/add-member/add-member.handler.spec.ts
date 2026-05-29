import { EventBus } from '@nestjs/cqrs';

import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { DuplicateMembershipException } from '@contexts/spaces/domain/exceptions/duplicate-membership.exception';
import { NotASpaceMemberException } from '@contexts/spaces/domain/exceptions/not-a-space-member.exception';
import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
import { MembershipRole } from '@contexts/spaces/domain/value-objects/membership-role/membership-role.vo';
import { ISpaceReadRepository } from '@contexts/spaces/domain/repositories/read/space-read.repository';
import { ISpaceWriteRepository } from '@contexts/spaces/domain/repositories/write/space-write.repository';

import { AddMemberCommand } from './add-member.command';
import { AddMemberCommandHandler } from './add-member.handler';

const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';
const MEMBER_ID = '550e8400-e29b-41d4-a716-446655440002';
const NON_OWNER_ID = '550e8400-e29b-41d4-a716-446655440003';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AddMemberCommandHandler', () => {
  let handler: AddMemberCommandHandler;
  let spaceReadRepository: jest.Mocked<ISpaceReadRepository>;
  let spaceWriteRepository: jest.Mocked<ISpaceWriteRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let space: SpaceAggregate;

  beforeEach(() => {
    jest.clearAllMocks();

    space = SpaceAggregate.create(OWNER_ID, 'Test Space');

    spaceReadRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
    } as jest.Mocked<ISpaceReadRepository>;

    spaceWriteRepository = {
      save: jest.fn(),
    } as jest.Mocked<ISpaceWriteRepository>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new AddMemberCommandHandler(
      spaceReadRepository,
      spaceWriteRepository,
      eventBus,
    );
  });

  describe('happy path', () => {
    it('should add a member when requester is the owner', async () => {
      spaceReadRepository.findById.mockResolvedValue(space);
      spaceWriteRepository.save.mockResolvedValue(undefined);

      await handler.execute(
        new AddMemberCommand(space.id.value, OWNER_ID, MEMBER_ID),
      );

      expect(spaceWriteRepository.save).toHaveBeenCalledTimes(1);
      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('space not found', () => {
    it('should throw SpaceNotFoundException when space does not exist', async () => {
      spaceReadRepository.findById.mockResolvedValue(null);

      await expect(
        handler.execute(new AddMemberCommand(SPACE_ID, OWNER_ID, MEMBER_ID)),
      ).rejects.toThrow(SpaceNotFoundException);
    });
  });

  describe('authorization', () => {
    it('should throw NotASpaceMemberException when requester is not the owner', async () => {
      space.addMember(NON_OWNER_ID, MembershipRole.MEMBER);
      spaceReadRepository.findById.mockResolvedValue(space);

      await expect(
        handler.execute(
          new AddMemberCommand(space.id.value, NON_OWNER_ID, MEMBER_ID),
        ),
      ).rejects.toThrow(NotASpaceMemberException);
    });

    it('should throw NotASpaceMemberException when requester is not a member at all', async () => {
      spaceReadRepository.findById.mockResolvedValue(space);

      await expect(
        handler.execute(
          new AddMemberCommand(space.id.value, NON_OWNER_ID, MEMBER_ID),
        ),
      ).rejects.toThrow(NotASpaceMemberException);
    });
  });

  describe('duplicate member', () => {
    it('should throw DuplicateMembershipException when target is already a member', async () => {
      space.addMember(MEMBER_ID, MembershipRole.MEMBER);
      spaceReadRepository.findById.mockResolvedValue(space);

      await expect(
        handler.execute(
          new AddMemberCommand(space.id.value, OWNER_ID, MEMBER_ID),
        ),
      ).rejects.toThrow(DuplicateMembershipException);
    });
  });
});
