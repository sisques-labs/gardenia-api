import { DeleteUserCommand } from '@contexts/users/application/commands/delete-user/delete-user.command';
import { UpdateUserCommand } from '@contexts/users/application/commands/update-user/update-user.command';
import { UserDeleteRequestDto } from '@contexts/users/transport/graphql/dtos/requests/user/user-delete.request.dto';
import { UserUpdateRequestDto } from '@contexts/users/transport/graphql/dtos/requests/user/user-update.request.dto';
import { Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit/graphql';

@Resolver()
//@UseGuards(JwtAuthGuard)
export class UserMutationsResolver {
  private readonly logger = new Logger(UserMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  @Mutation(() => MutationResponseDto)
  async userUpdate(
    @Args('input') input: UserUpdateRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Updating user with input: ${JSON.stringify(input)}`);

    await this.commandBus.execute(
      new UpdateUserCommand({
        id: input.id,
        status: input.status,
        username: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
        avatarUrl: input.avatarUrl,
        bio: input.bio,
        locale: input.locale,
        timezone: input.timezone,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'User updated successfully',
      id: input.id,
    });
  }

  @Mutation(() => MutationResponseDto)
  async userDelete(
    @Args('input') input: UserDeleteRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Deleting user with input: ${JSON.stringify(input)}`);

    await this.commandBus.execute(
      new DeleteUserCommand({
        id: input.id,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'User deleted successfully',
      id: input.id,
    });
  }
}
