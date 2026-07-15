import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit/graphql';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { AcceptSpaceInvitationCommand } from '@contexts/spaces/application/commands/accept-space-invitation/accept-space-invitation.command';
import { AddMemberCommand } from '@contexts/spaces/application/commands/add-member/add-member.command';
import { CreateSpaceInvitationCommand } from '@contexts/spaces/application/commands/create-space-invitation/create-space-invitation.command';
import { CreateSpaceCommand } from '@contexts/spaces/application/commands/create-space/create-space.command';
import { RemoveMemberCommand } from '@contexts/spaces/application/commands/remove-member/remove-member.command';
import { UpdateSpaceCommand } from '@contexts/spaces/application/commands/update-space/update-space.command';
import { ResolveInvitationSpaceContextService } from '@contexts/spaces/application/services/write/resolve-invitation-space-context/resolve-invitation-space-context.service';
import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';
import { IdentityOnly } from '@shared/decorators/identity-only.decorator';
import { SkipSpace } from '../../../../../../shared/decorators/skip-space.decorator';
import { SpaceAcceptInvitationRequestDto } from '../../dtos/requests/space/space-accept-invitation.request.dto';
import { SpaceAddMemberRequestDto } from '../../dtos/requests/space/space-add-member.request.dto';
import { SpaceCreateInvitationRequestDto } from '../../dtos/requests/space/space-create-invitation.request.dto';
import { SpaceCreateRequestDto } from '../../dtos/requests/space/space-create.request.dto';
import { SpaceRemoveMemberRequestDto } from '../../dtos/requests/space/space-remove-member.request.dto';
import { SpaceUpdateRequestDto } from '../../dtos/requests/space/space-update.request.dto';
import { SpaceInvitationGraphQLMapper } from '../../mappers/space-invitation/space-invitation.mapper';
import { SpaceInvitationResponseDto } from '../../objects/space-invitation.object';

@Resolver()
@UseGuards(JwtAuthGuard)
export class SpaceMutationsResolver {
  private readonly logger = new Logger(SpaceMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
    private readonly spaceInvitationGraphQLMapper: SpaceInvitationGraphQLMapper,
    private readonly resolveInvitationSpaceContextService: ResolveInvitationSpaceContextService,
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

  @Mutation(() => SpaceInvitationResponseDto)
  async spaceCreateInvitation(
    @CurrentUser() user: CurrentUserPayload,
    @Args('input') input: SpaceCreateInvitationRequestDto,
  ): Promise<SpaceInvitationResponseDto> {
    this.logger.log(
      `Creating invitation for space ${input.spaceId} by user: ${user.userId}`,
    );

    const vm = await this.commandBus.execute<
      CreateSpaceInvitationCommand,
      SpaceInvitationViewModel
    >(
      new CreateSpaceInvitationCommand({
        spaceId: input.spaceId,
        requestingUserId: user.userId,
        role: input.role,
        expiresAt: input.expiresAt,
      }),
    );

    return this.spaceInvitationGraphQLMapper.toResponse(vm);
  }

  @IdentityOnly()
  @Mutation(() => MutationResponseDto)
  async spaceAcceptInvitation(
    @CurrentUser() user: CurrentUserPayload,
    @Args('input') input: SpaceAcceptInvitationRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Accepting invitation for user: ${user.userId}`);

    // TODO: Technical debt: This is not the best way to handle this. We should use the spaceId directly and not the run method.
    const spaceId = await this.resolveInvitationSpaceContextService.run(
      input.code,
      () =>
        this.commandBus.execute<AcceptSpaceInvitationCommand, string>(
          new AcceptSpaceInvitationCommand({
            code: input.code,
            acceptingUserId: user.userId,
          }),
        ),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Invitation accepted successfully',
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

  @Mutation(() => MutationResponseDto)
  async spaceUpdate(
    @CurrentUser() user: CurrentUserPayload,
    @Args('input') input: SpaceUpdateRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Updating space ${input.spaceId} by user: ${user.userId}`);

    await this.commandBus.execute(
      new UpdateSpaceCommand({
        spaceId: input.spaceId,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        environment: input.environment ?? null,
        requestingUserId: user.userId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Space updated successfully',
      id: input.spaceId,
    });
  }
}
