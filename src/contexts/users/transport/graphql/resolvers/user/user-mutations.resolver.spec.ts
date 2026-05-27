import { DeleteUserCommand } from '@contexts/users/application/commands/delete-user/delete-user.command';
import { UpdateUserCommand } from '@contexts/users/application/commands/update-user/update-user.command';
import { CommandBus } from '@nestjs/cqrs';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
  UserStatusEnum,
} from '@sisques-labs/nestjs-kit';

import { UserMutationsResolver } from './user-mutations.resolver';

describe('UserMutationsResolver', () => {
  let sut: UserMutationsResolver;
  let commandBus: jest.Mocked<CommandBus>;
  let mutationResponseGraphQLMapper: jest.Mocked<MutationResponseGraphQLMapper>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    mutationResponseGraphQLMapper = {
      toResponseDto: jest.fn(),
    } as unknown as jest.Mocked<MutationResponseGraphQLMapper>;
    sut = new UserMutationsResolver(commandBus, mutationResponseGraphQLMapper);
  });

  describe('userUpdate()', () => {
    it('should execute UpdateUserCommand with correct input', async () => {
      commandBus.execute.mockResolvedValue(undefined);
      const mockResponse = { success: true } as MutationResponseDto;
      mutationResponseGraphQLMapper.toResponseDto.mockReturnValue(mockResponse);

      await sut.userUpdate({
        id: '550e8400-e29b-41d4-a716-446655440001',
        status: UserStatusEnum.ACTIVE,
      });

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdateUserCommand),
      );
    });

    it('should return mapped mutation response', async () => {
      commandBus.execute.mockResolvedValue(undefined);
      const mockResponse = {
        success: true,
        message: 'User updated successfully',
        id: '550e8400-e29b-41d4-a716-446655440001',
      } as MutationResponseDto;
      mutationResponseGraphQLMapper.toResponseDto.mockReturnValue(mockResponse);

      const result = await sut.userUpdate({
        id: '550e8400-e29b-41d4-a716-446655440001',
        status: UserStatusEnum.ACTIVE,
      });

      expect(mutationResponseGraphQLMapper.toResponseDto).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('userDelete()', () => {
    it('should execute DeleteUserCommand with the given id', async () => {
      commandBus.execute.mockResolvedValue(undefined);
      const mockResponse = { success: true } as MutationResponseDto;
      mutationResponseGraphQLMapper.toResponseDto.mockReturnValue(mockResponse);

      await sut.userDelete({ id: '550e8400-e29b-41d4-a716-446655440002' });

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteUserCommand),
      );
    });

    it('should return mapped mutation response', async () => {
      commandBus.execute.mockResolvedValue(undefined);
      const mockResponse = {
        success: true,
        message: 'User deleted successfully',
        id: '550e8400-e29b-41d4-a716-446655440002',
      } as MutationResponseDto;
      mutationResponseGraphQLMapper.toResponseDto.mockReturnValue(mockResponse);

      const result = await sut.userDelete({
        id: '550e8400-e29b-41d4-a716-446655440002',
      });

      expect(mutationResponseGraphQLMapper.toResponseDto).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
      expect(result).toBe(mockResponse);
    });
  });
});
