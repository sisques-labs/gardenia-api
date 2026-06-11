import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { AddMemberCommand } from '@contexts/spaces/application/commands/add-member/add-member.command';
import { CreateSpaceCommand } from '@contexts/spaces/application/commands/create-space/create-space.command';
import { RemoveMemberCommand } from '@contexts/spaces/application/commands/remove-member/remove-member.command';
import { SpaceFindByIdQuery } from '@contexts/spaces/application/queries/space-find-by-id/space-find-by-id.query';
import { SpacesFindByUserQuery } from '@contexts/spaces/application/queries/spaces-find-by-user/spaces-find-by-user.query';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';
import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';

import { SpaceInvitationRestMapper } from '../mappers/space-invitation/space-invitation.mapper';
import { SpaceRestMapper } from '../mappers/space/space.mapper';
import { SpaceRestResponseDto } from '../dtos/space-rest-response.dto';
import { CreateSpaceDto } from '../dtos/create-space.dto';
import { AddMemberDto } from '../dtos/add-member.dto';
import { SpacesController } from './spaces.controller';

const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const TARGET_USER_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildCurrentUser = (userId = USER_ID): CurrentUserPayload => ({
  userId,
  email: 'owner@example.com',
  appRole: AppRoleEnum.USER,
});

const buildSpaceViewModel = (id = SPACE_ID): SpaceViewModel =>
  new SpaceViewModel({
    id,
    name: 'Test Space',
    ownerId: USER_ID,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

const buildSpaceResponseDto = (id = SPACE_ID): SpaceRestResponseDto => {
  const dto = new SpaceRestResponseDto();
  dto.id = id;
  dto.name = 'Test Space';
  dto.ownerId = USER_ID;
  dto.createdAt = new Date('2024-01-01');
  dto.updatedAt = new Date('2024-01-01');
  return dto;
};

describe('SpacesController', () => {
  let sut: SpacesController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let spaceRestMapper: jest.Mocked<SpaceRestMapper>;
  let spaceInvitationRestMapper: jest.Mocked<SpaceInvitationRestMapper>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    spaceRestMapper = {
      toResponse: jest.fn(),
    } as unknown as jest.Mocked<SpaceRestMapper>;
    spaceInvitationRestMapper = {
      toResponse: jest.fn(),
      toAcceptResponse: jest.fn(),
    } as unknown as jest.Mocked<SpaceInvitationRestMapper>;
    sut = new SpacesController(
      commandBus,
      queryBus,
      spaceRestMapper,
      spaceInvitationRestMapper,
    );
  });

  describe('createSpace()', () => {
    const dto: CreateSpaceDto = { name: 'My Space' };
    const currentUser = buildCurrentUser();

    it('should dispatch CreateSpaceCommand with ownerId from @CurrentUser, not body', async () => {
      const vm = buildSpaceViewModel();
      const responseDto = buildSpaceResponseDto();
      commandBus.execute.mockResolvedValueOnce(SPACE_ID);
      queryBus.execute.mockResolvedValueOnce(vm);
      spaceRestMapper.toResponse.mockReturnValue(responseDto);

      await sut.createSpace(dto, currentUser);

      const dispatched = commandBus.execute.mock
        .calls[0][0] as CreateSpaceCommand;
      expect(dispatched).toBeInstanceOf(CreateSpaceCommand);
      expect(dispatched.ownerId.value).toBe(currentUser.userId);
      expect(dispatched.name.value).toBe(dto.name);
    });

    it('should ignore any ownerId field present in dto body', async () => {
      const vm = buildSpaceViewModel();
      const responseDto = buildSpaceResponseDto();
      commandBus.execute.mockResolvedValueOnce(SPACE_ID);
      queryBus.execute.mockResolvedValueOnce(vm);
      spaceRestMapper.toResponse.mockReturnValue(responseDto);

      const dtoWithSpoofedOwner = { ...dto, ownerId: 'attacker-id' } as any;
      await sut.createSpace(dtoWithSpoofedOwner, currentUser);

      const dispatched = commandBus.execute.mock
        .calls[0][0] as CreateSpaceCommand;
      expect(dispatched.ownerId.value).toBe(currentUser.userId);
      expect(dispatched.ownerId.value).not.toBe('attacker-id');
    });

    it('should dispatch SpaceFindByIdQuery with the returned spaceId', async () => {
      const vm = buildSpaceViewModel();
      const responseDto = buildSpaceResponseDto();
      commandBus.execute.mockResolvedValueOnce(SPACE_ID);
      queryBus.execute.mockResolvedValueOnce(vm);
      spaceRestMapper.toResponse.mockReturnValue(responseDto);

      await sut.createSpace(dto, currentUser);

      const dispatched = queryBus.execute.mock
        .calls[0][0] as SpaceFindByIdQuery;
      expect(dispatched).toBeInstanceOf(SpaceFindByIdQuery);
      expect(dispatched.spaceId.value).toBe(SPACE_ID);
    });

    it('should return mapped SpaceRestResponseDto', async () => {
      const vm = buildSpaceViewModel();
      const responseDto = buildSpaceResponseDto();
      commandBus.execute.mockResolvedValueOnce(SPACE_ID);
      queryBus.execute.mockResolvedValueOnce(vm);
      spaceRestMapper.toResponse.mockReturnValue(responseDto);

      const result = await sut.createSpace(dto, currentUser);

      expect(result).toBe(responseDto);
      expect(spaceRestMapper.toResponse).toHaveBeenCalledWith(vm);
    });
  });

  describe('listMySpaces()', () => {
    const currentUser = buildCurrentUser();

    it('should dispatch SpacesFindByUserQuery with userId from @CurrentUser', async () => {
      const vm = buildSpaceViewModel();
      const paginatedResult = new PaginatedResult([vm], 1, 1, 10);
      queryBus.execute.mockResolvedValueOnce(paginatedResult);
      spaceRestMapper.toResponse.mockReturnValue(buildSpaceResponseDto());

      await sut.listMySpaces(currentUser);

      const dispatched = queryBus.execute.mock
        .calls[0][0] as SpacesFindByUserQuery;
      expect(dispatched).toBeInstanceOf(SpacesFindByUserQuery);
      expect(dispatched.userId.value).toBe(currentUser.userId);
    });

    it('should return a paginated result of SpaceRestResponseDto items', async () => {
      const vm = buildSpaceViewModel();
      const paginatedResult = new PaginatedResult([vm], 1, 1, 10);
      const responseDto = buildSpaceResponseDto();
      queryBus.execute.mockResolvedValueOnce(paginatedResult);
      spaceRestMapper.toResponse.mockReturnValue(responseDto);

      const result = await sut.listMySpaces(currentUser);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBe(responseDto);
      expect(result.total).toBe(1);
    });

    it('should not call commandBus inside listMySpaces()', async () => {
      queryBus.execute.mockResolvedValueOnce(new PaginatedResult([], 0, 1, 10));

      await sut.listMySpaces(currentUser);

      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('getSpace()', () => {
    it('should dispatch SpaceFindByIdQuery with correct spaceId', async () => {
      const vm = buildSpaceViewModel();
      const responseDto = buildSpaceResponseDto();
      queryBus.execute.mockResolvedValueOnce(vm);
      spaceRestMapper.toResponse.mockReturnValue(responseDto);

      await sut.getSpace(SPACE_ID);

      const dispatched = queryBus.execute.mock
        .calls[0][0] as SpaceFindByIdQuery;
      expect(dispatched).toBeInstanceOf(SpaceFindByIdQuery);
      expect(dispatched.spaceId.value).toBe(SPACE_ID);
    });

    it('should return the mapped SpaceRestResponseDto', async () => {
      const vm = buildSpaceViewModel();
      const responseDto = buildSpaceResponseDto();
      queryBus.execute.mockResolvedValueOnce(vm);
      spaceRestMapper.toResponse.mockReturnValue(responseDto);

      const result = await sut.getSpace(SPACE_ID);

      expect(result).toBe(responseDto);
    });
  });

  describe('addMember()', () => {
    const currentUser = buildCurrentUser();
    const dto: AddMemberDto = { userId: TARGET_USER_ID };

    it('should dispatch AddMemberCommand with correct spaceId, targetUserId and requestingUserId', async () => {
      commandBus.execute.mockResolvedValueOnce(undefined);

      await sut.addMember(SPACE_ID, dto, currentUser);

      const dispatched = commandBus.execute.mock
        .calls[0][0] as AddMemberCommand;
      expect(dispatched).toBeInstanceOf(AddMemberCommand);
      expect(dispatched.spaceId.value).toBe(SPACE_ID);
      expect(dispatched.targetUserId.value).toBe(TARGET_USER_ID);
      expect(dispatched.requestingUserId.value).toBe(currentUser.userId);
    });

    it('should return undefined (void / 201 semantics)', async () => {
      commandBus.execute.mockResolvedValueOnce(undefined);

      const result = await sut.addMember(SPACE_ID, dto, currentUser);

      expect(result).toBeUndefined();
    });
  });

  describe('removeMember()', () => {
    const currentUser = buildCurrentUser();

    it('should dispatch RemoveMemberCommand with correct spaceId, targetUserId and requestingUserId', async () => {
      commandBus.execute.mockResolvedValueOnce(undefined);

      await sut.removeMember(SPACE_ID, TARGET_USER_ID, currentUser);

      const dispatched = commandBus.execute.mock
        .calls[0][0] as RemoveMemberCommand;
      expect(dispatched).toBeInstanceOf(RemoveMemberCommand);
      expect(dispatched.spaceId.value).toBe(SPACE_ID);
      expect(dispatched.targetUserId.value).toBe(TARGET_USER_ID);
      expect(dispatched.requestingUserId.value).toBe(currentUser.userId);
    });

    it('should return undefined (void / 204 semantics)', async () => {
      commandBus.execute.mockResolvedValueOnce(undefined);

      const result = await sut.removeMember(
        SPACE_ID,
        TARGET_USER_ID,
        currentUser,
      );

      expect(result).toBeUndefined();
    });
  });
});
