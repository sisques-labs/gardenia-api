import { Logger, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { SpaceFindByIdQuery } from '@contexts/spaces/application/queries/space-find-by-id/space-find-by-id.query';
import { SpaceInvitationPreviewFindByCodeQuery } from '@contexts/spaces/application/queries/space-invitation-preview-find-by-code/space-invitation-preview-find-by-code.query';
import { SpacesFindByUserQuery } from '@contexts/spaces/application/queries/spaces-find-by-user/spaces-find-by-user.query';
import { SkipSpace } from '../../../../../../shared/decorators/skip-space.decorator';
import { SpaceFindByIdRequestDto } from '../../dtos/requests/space/space-find-by-id.request.dto';
import {
  PaginatedSpaceResultDto,
  SpaceResponseDto,
} from '../../dtos/responses/space/space.response.dto';
import { SpaceInvitationGraphQLMapper } from '../../mappers/space-invitation/space-invitation.mapper';
import { SpaceGraphQLMapper } from '../../mappers/space/space.mapper';
import { SpaceInvitationPreviewResponseDto } from '../../objects/space-invitation-preview.object';

@Resolver()
export class SpaceQueriesResolver {
  private readonly logger = new Logger(SpaceQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly spaceGraphQLMapper: SpaceGraphQLMapper,
    private readonly spaceInvitationGraphQLMapper: SpaceInvitationGraphQLMapper,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => SpaceResponseDto, { nullable: true })
  async spaceFindById(
    @Args('input') input: SpaceFindByIdRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<SpaceResponseDto | null> {
    this.logger.log(
      `Finding space by id: ${input.id} for user: ${user.userId}`,
    );

    const result = await this.queryBus.execute(
      new SpaceFindByIdQuery({ spaceId: input.id }),
    );

    return result
      ? this.spaceGraphQLMapper.toResponseDtoFromViewModel(result)
      : null;
  }

  @SkipSpace()
  @UseGuards(JwtAuthGuard)
  @Query(() => PaginatedSpaceResultDto)
  async spacesFindByUser(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<PaginatedSpaceResultDto> {
    this.logger.log(`Finding spaces for user: ${user.userId}`);

    const result = await this.queryBus.execute(
      new SpacesFindByUserQuery({ userId: user.userId }),
    );

    return this.spaceGraphQLMapper.toPaginatedResponseDto(result);
  }

  @SkipSpace()
  @Query(() => SpaceInvitationPreviewResponseDto)
  async spaceInvitationPreview(
    @Args('code') code: string,
  ): Promise<SpaceInvitationPreviewResponseDto> {
    this.logger.log(`Previewing invitation with code ${code}`);

    const result = await this.queryBus.execute(
      new SpaceInvitationPreviewFindByCodeQuery({ code }),
    );

    return this.spaceInvitationGraphQLMapper.toPreviewResponse(result);
  }
}
