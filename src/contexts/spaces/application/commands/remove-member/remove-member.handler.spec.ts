import { EventBus } from '@nestjs/cqrs';

import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { LastOwnerRemovalException } from '@contexts/spaces/domain/exceptions/last-owner-removal.exception';
import { NotASpaceMemberException } from '@contexts/spaces/domain/exceptions/not-a-space-member.exception';
import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
import { MembershipRole } from '@contexts/spaces/domain/value-objects/membership-role/membership-role.vo';
import { ISpaceReadRepository } from '@contexts/spaces/domain/repositories/read/space-read.repository';
import { ISpaceWriteRepository } from '@contexts/spaces/domain/repositories/write/space-write.repository';

import { RemoveMemberCommand } from './remove-member.command';
import { RemoveMemberCommandHandler } from './remove-member.handler';

const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';
const MEMBER_ID = '550e8400-e29b-41d4-a716-446655440002';
const NON_OWNER_ID = '550e8400-e29b-41d4-a716-446655440003';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('RemoveMemberCommandHandler', () => {
  let handler: RemoveMemberCommandHandler;
  let spaceReadRepository: jest.Mocked<ISpaceReadRepository>;
  let spaceWriteRepository: jest.Mocked<ISpaceWriteRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let space: SpaceAggregate;

  beforeEach(() => {
    jest.clearAllMocks();

    space = SpaceAggregate.create(OWNER_ID, 'Test Space');
    space.addMember(MEMBER_ID, MembershipRole.MEMBER);

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

    handler = new RemoveMemberCommandHandler(
      spaceReadRepository,
      spaceWriteRepository,
      eventBus,
    );
  });

  describe('happy path', () => {
    it('should remove a member when requester is the owner', async () => {
      spaceReadRepository.findById.mockResolvedValue(space);
      spaceWriteRepository.save.mockResolvedValue(undefined);

      await handler.execute(
        new RemoveMemberCommand(space.id.value, OWNER_ID, MEMBER_ID),
      );

      expect(spaceWriteRepository.save).toHaveBeenCalledTimes(1);
      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('space not found', () => {
    it('should throw SpaceNotFoundException when space does not exist', async () => {
      spaceReadRepository.findById.mockResolvedValue(null);

      await expect(
        handler.execute(new RemoveMemberCommand(SPACE_ID, OWNER_ID, MEMBER_ID)),
      ).rejects.toThrow(SpaceNotFoundException);
    });
  });

  describe('authorization', () => {
    it('should throw NotASpaceMemberException when requester is not the owner', async () => {
      space.addMember(NON_OWNER_ID, MembershipRole.MEMBER);
      spaceReadRepository.findById.mockResolvedValue(space);

      await expect(
        handler.execute(
          new RemoveMemberCommand(space.id.value, NON_OWNER_ID, MEMBER_ID),
        ),
      ).rejects.toThrow(NotASpaceMemberException);
    });
  });

  describe('last owner removal', () => {
    it('should throw LastOwnerRemovalException when removing the last owner', async () => {
      const ownerOnlySpace = SpaceAggregate.create(
        OWNER_ID,
        'Owner Only Space',
      );
      spaceReadRepository.findById.mockResolvedValue(ownerOnlySpace);

      await expect(
        handler.execute(
          new RemoveMemberCommand(ownerOnlySpace.id.value, OWNER_ID, OWNER_ID),
        ),
      ).rejects.toThrow(LastOwnerRemovalException);
    });
  });

  describe('non-member removal', () => {
    it('should throw NotASpaceMemberException at aggregate level when target is not a member', async () => {
      spaceReadRepository.findById.mockResolvedValue(space);

      await expect(
        handler.execute(
          new RemoveMemberCommand(space.id.value, OWNER_ID, NON_OWNER_ID),
        ),
      ).rejects.toThrow(NotASpaceMemberException);
    });
  });
});
