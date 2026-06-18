import { Logger, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { GetSpaceWeatherQuery } from '@contexts/spaces/application/queries/get-space-weather/get-space-weather.query';
import { SpaceFindByIdQuery } from '@contexts/spaces/application/queries/space-find-by-id/space-find-by-id.query';
import { SpacesFindByUserQuery } from '@contexts/spaces/application/queries/spaces-find-by-user/spaces-find-by-user.query';
import { SkipSpace } from '../../../../../../shared/decorators/skip-space.decorator';
import { SpaceFindByIdRequestDto } from '../../dtos/requests/space/space-find-by-id.request.dto';
import { SpaceWeatherRequestDto } from '../../dtos/requests/space/space-weather.request.dto';
import {
  PaginatedSpaceResultDto,
  SpaceResponseDto,
} from '../../dtos/responses/space/space.response.dto';
import { SpaceWeatherResponseDto } from '../../dtos/responses/space/space-weather.response.dto';
import { SpaceGraphQLMapper } from '../../mappers/space/space.mapper';

@Resolver()
export class SpaceQueriesResolver {
  private readonly logger = new Logger(SpaceQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly spaceGraphQLMapper: SpaceGraphQLMapper,
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

  @UseGuards(JwtAuthGuard)
  @Query(() => SpaceWeatherResponseDto, { nullable: true, name: 'spaceWeather' })
  async spaceWeather(
    @Args('input') input: SpaceWeatherRequestDto,
  ): Promise<SpaceWeatherResponseDto | null> {
    this.logger.log(`Getting weather for space: ${input.spaceId}`);

    return this.queryBus.execute(new GetSpaceWeatherQuery(input.spaceId));
  }
}
