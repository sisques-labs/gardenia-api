import { CommandBus } from '@nestjs/cqrs';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit';

import { DeleteFileCommand } from '@contexts/files/application/commands/delete-file/delete-file.command';
import { FileMutationsResolver } from './file-mutations.resolver';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('FileMutationsResolver', () => {
  let resolver: FileMutationsResolver;
  let commandBus: jest.Mocked<CommandBus>;
  let mapper: jest.Mocked<MutationResponseGraphQLMapper>;
  const response = { success: true } as MutationResponseDto;

  beforeEach(() => {
    jest.clearAllMocks();

    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    mapper = {
      toResponseDto: jest.fn().mockReturnValue(response),
    } as unknown as jest.Mocked<MutationResponseGraphQLMapper>;

    resolver = new FileMutationsResolver(commandBus, mapper);
  });

  describe('fileDelete()', () => {
    it('dispatches DeleteFileCommand and returns the mapped response', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      const result = await resolver.fileDelete({ id: FILE_ID } as never);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteFileCommand),
      );
      expect(mapper.toResponseDto).toHaveBeenCalledWith({
        success: true,
        message: 'File deleted successfully',
        id: FILE_ID,
      });
      expect(result).toBe(response);
    });
  });
});
