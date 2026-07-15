import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { DeleteFileCommand } from '@contexts/files/application/commands/delete-file/delete-file.command';
import { FileDeleteRequestDto } from '@contexts/files/transport/graphql/dtos/requests/file-delete.request.dto';

/**
 * Binary upload is handled exclusively via the REST multipart endpoint; only
 * delete is exposed over GraphQL.
 */
@UseGuards(JwtAuthGuard)
@Resolver()
export class FileMutationsResolver {
  private readonly logger = new Logger(FileMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  @Mutation(() => MutationResponseDto)
  async fileDelete(
    @Args('input') input: FileDeleteRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Deleting file ${input.id}`);

    await this.commandBus.execute(new DeleteFileCommand({ id: input.id }));

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'File deleted successfully',
      id: input.id,
    });
  }
}
