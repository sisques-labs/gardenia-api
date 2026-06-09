import { CommandBus } from '@nestjs/cqrs';
import { MutationResponseGraphQLMapper } from '@sisques-labs/nestjs-kit';

import { SKIP_SPACE_KEY } from '../../../../../../shared/decorators/skip-space.decorator';
import { SpaceCreateRequestDto } from '../../dtos/requests/space/space-create.request.dto';
import { SpaceAddMemberRequestDto } from '../../dtos/requests/space/space-add-member.request.dto';
import { SpaceRemoveMemberRequestDto } from '../../dtos/requests/space/space-remove-member.request.dto';
import { ResolveInvitationSpaceContextService } from '@contexts/spaces/application/services/write/resolve-invitation-space-context/resolve-invitation-space-context.service';

import { SpaceInvitationGraphQLMapper } from '../../mappers/space-invitation/space-invitation.mapper';
import { SpaceMutationsResolver } from './space-mutations.resolver';

const SPACE_ID = 'a1b2c3d4-e5f6-4890-8bcd-ef1234567890';
const OWNER_ID = 'b2c3d4e5-f6a7-4901-8cde-f12345678901';
const TARGET_USER_ID = 'c3d4e5f6-a7b8-4012-8def-123456789012';

describe('SpaceMutationsResolver', () => {
  let resolver: SpaceMutationsResolver;
  let commandBus: jest.Mocked<CommandBus>;
  let mutationResponseGraphQLMapper: jest.Mocked<MutationResponseGraphQLMapper>;
  let spaceInvitationGraphQLMapper: jest.Mocked<SpaceInvitationGraphQLMapper>;
  let resolveInvitationSpaceContextService: jest.Mocked<ResolveInvitationSpaceContextService>;

  const mockUser = { userId: OWNER_ID, email: 'owner@test.com', sub: OWNER_ID };

  beforeEach(() => {
    jest.clearAllMocks();

    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    mutationResponseGraphQLMapper = {
      toResponseDto: jest.fn(),
    } as unknown as jest.Mocked<MutationResponseGraphQLMapper>;
    spaceInvitationGraphQLMapper = {
      toResponse: jest.fn(),
      toAcceptResponse: jest.fn(),
    } as unknown as jest.Mocked<SpaceInvitationGraphQLMapper>;
    resolveInvitationSpaceContextService = {
      run: jest.fn((_code, fn) => fn()),
    } as unknown as jest.Mocked<ResolveInvitationSpaceContextService>;

    resolver = new SpaceMutationsResolver(
      commandBus,
      mutationResponseGraphQLMapper,
      spaceInvitationGraphQLMapper,
      resolveInvitationSpaceContextService,
    );
  });

  describe('spaceCreate', () => {
    it('dispatches CreateSpaceCommand with name and ownerId from CurrentUser', async () => {
      commandBus.execute.mockResolvedValueOnce(SPACE_ID);
      mutationResponseGraphQLMapper.toResponseDto.mockReturnValueOnce({
        success: true,
        message: 'Space created successfully',
        id: SPACE_ID,
      });

      const input: SpaceCreateRequestDto = { name: 'My Garden' };
      const result = await resolver.spaceCreate(mockUser as any, input);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const command = commandBus.execute.mock.calls[0][0] as any;
      expect(command.name.value).toBe('My Garden');
      expect(command.ownerId.value).toBe(OWNER_ID);
      expect(result.id).toBe(SPACE_ID);
    });

    it('has @SkipSpace metadata on spaceCreate', () => {
      const method = SpaceMutationsResolver.prototype.spaceCreate;
      const metadata = Reflect.getMetadata(SKIP_SPACE_KEY, method);
      expect(metadata).toBe(true);
    });
  });

  describe('spaceAddMember', () => {
    it('dispatches AddMemberCommand with requestingUserId from CurrentUser', async () => {
      commandBus.execute.mockResolvedValueOnce(undefined);
      mutationResponseGraphQLMapper.toResponseDto.mockReturnValueOnce({
        success: true,
        message: 'Member added successfully',
        id: SPACE_ID,
      });

      const input: SpaceAddMemberRequestDto = {
        spaceId: SPACE_ID,
        targetUserId: TARGET_USER_ID,
      };
      const result = await resolver.spaceAddMember(mockUser as any, input);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const command = commandBus.execute.mock.calls[0][0] as any;
      expect(command.spaceId.value).toBe(SPACE_ID);
      expect(command.targetUserId.value).toBe(TARGET_USER_ID);
      expect(command.requestingUserId.value).toBe(OWNER_ID);
      expect(result.id).toBe(SPACE_ID);
    });
  });

  describe('spaceRemoveMember', () => {
    it('dispatches RemoveMemberCommand with requestingUserId from CurrentUser', async () => {
      commandBus.execute.mockResolvedValueOnce(undefined);
      mutationResponseGraphQLMapper.toResponseDto.mockReturnValueOnce({
        success: true,
        message: 'Member removed successfully',
        id: SPACE_ID,
      });

      const input: SpaceRemoveMemberRequestDto = {
        spaceId: SPACE_ID,
        targetUserId: TARGET_USER_ID,
      };
      const result = await resolver.spaceRemoveMember(mockUser as any, input);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const command = commandBus.execute.mock.calls[0][0] as any;
      expect(command.spaceId.value).toBe(SPACE_ID);
      expect(command.targetUserId.value).toBe(TARGET_USER_ID);
      expect(command.requestingUserId.value).toBe(OWNER_ID);
      expect(result.id).toBe(SPACE_ID);
    });
  });
});
