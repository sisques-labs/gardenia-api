import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { AddMemberCommand } from '@contexts/spaces/application/commands/add-member/add-member.command';
import { CreateSpaceCommand } from '@contexts/spaces/application/commands/create-space/create-space.command';
import { RemoveMemberCommand } from '@contexts/spaces/application/commands/remove-member/remove-member.command';
import { SkipSpace } from '../../../../../../shared/decorators/skip-space.decorator';
import { SpaceAddMemberRequestDto } from '../../dtos/requests/space/space-add-member.request.dto';
import { SpaceCreateRequestDto } from '../../dtos/requests/space/space-create.request.dto';
import { SpaceRemoveMemberRequestDto } from '../../dtos/requests/space/space-remove-member.request.dto';

@Resolver()
@UseGuards(JwtAuthGuard)
export class SpaceMutationsResolver {
  private readonly logger = new Logger(SpaceMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  @SkipSpace()
  @Mutation(() => MutationResponseDto)
  async spaceCreate(
    @CurrentUser() user: CurrentUserPayload,
    @Args('input') input: SpaceCreateRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Creating space for user: ${user.userId}`);

    const spaceId = await this.commandBus.execute<CreateSpaceCommand, string>(
      new CreateSpaceCommand({
        name: input.name,
        ownerId: user.userId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Space created successfully',
      id: spaceId,
    });
  }

  @Mutation(() => MutationResponseDto)
  async spaceAddMember(
    @CurrentUser() user: CurrentUserPayload,
    @Args('input') input: SpaceAddMemberRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(
      `Adding member ${input.targetUserId} to space ${input.spaceId} by user: ${user.userId}`,
    );

    await this.commandBus.execute(
      new AddMemberCommand({
        spaceId: input.spaceId,
        targetUserId: input.targetUserId,
        requestingUserId: user.userId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Member added successfully',
      id: input.spaceId,
    });
  }

  @Mutation(() => MutationResponseDto)
  async spaceRemoveMember(
    @CurrentUser() user: CurrentUserPayload,
    @Args('input') input: SpaceRemoveMemberRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(
      `Removing member ${input.targetUserId} from space ${input.spaceId} by user: ${user.userId}`,
    );

    await this.commandBus.execute(
      new RemoveMemberCommand({
        spaceId: input.spaceId,
        targetUserId: input.targetUserId,
        requestingUserId: user.userId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Member removed successfully',
      id: input.spaceId,
    });
  }
}
