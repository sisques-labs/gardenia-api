import { UseGuards } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { GetSpaceWeatherQuery } from '@contexts/spaces/application/queries/get-space-weather/get-space-weather.query';
import { SpaceWeatherResponseDto } from '../../dtos/responses/space/space-weather.response.dto';
import { SpaceResponseDto } from '../../dtos/responses/space/space.response.dto';

@UseGuards(JwtAuthGuard)
@Resolver(() => SpaceResponseDto)
export class SpaceResolvedFieldsResolver {
  constructor(private readonly queryBus: QueryBus) {}

  @ResolveField('weather', () => SpaceWeatherResponseDto, { nullable: true })
  async weather(
    @Parent() space: SpaceResponseDto,
  ): Promise<SpaceWeatherResponseDto | null> {
    if (space.latitude == null || space.longitude == null) return null;
    return this.queryBus.execute(
      new GetSpaceWeatherQuery({ spaceId: space.id }),
    );
  }
}
