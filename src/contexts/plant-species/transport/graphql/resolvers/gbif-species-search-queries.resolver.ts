import { Logger, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { GbifSpeciesSearchQuery } from '@contexts/plant-species/application/queries/gbif-species-search/gbif-species-search.query';
import { GbifSpeciesSuggestion } from '@contexts/plant-species/application/ports/gbif-species-search.port';
import { SkipSpace } from '@shared/decorators/skip-space.decorator';

import { GbifSpeciesSearchRequestDto } from '@contexts/plant-species/transport/graphql/dtos/requests/gbif-species-search.request.dto';
import { GbifSpeciesSuggestionResponseDto } from '@contexts/plant-species/transport/graphql/dtos/responses/gbif-species-suggestion.response.dto';
import { PlantSpeciesGraphQLMapper } from '@contexts/plant-species/transport/graphql/mappers/plant-species.mapper';

@Resolver()
@SkipSpace()
@UseGuards(JwtAuthGuard)
export class GbifSpeciesSearchQueriesResolver {
  private readonly logger = new Logger(GbifSpeciesSearchQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly plantSpeciesGraphQLMapper: PlantSpeciesGraphQLMapper,
  ) {}

  @Query(() => [GbifSpeciesSuggestionResponseDto])
  async gbifSpeciesSearch(
    @Args('input') input: GbifSpeciesSearchRequestDto,
  ): Promise<GbifSpeciesSuggestionResponseDto[]> {
    this.logger.log(`Searching GBIF species: name=${input.name}`);

    const result = await this.queryBus.execute<
      GbifSpeciesSearchQuery,
      GbifSpeciesSuggestion[]
    >(new GbifSpeciesSearchQuery({ name: input.name, limit: input.limit }));

    return result.map((suggestion) =>
      this.plantSpeciesGraphQLMapper.toSuggestionResponseDto(suggestion),
    );
  }
}
