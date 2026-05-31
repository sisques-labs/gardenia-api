import { Logger, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Criteria } from '@sisques-labs/nestjs-kit';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { PlantSpeciesFindByCriteriaQuery } from '@contexts/plant-species/application/queries/plant-species-find-by-criteria/plant-species-find-by-criteria.query';
import { PlantSpeciesFindByIdQuery } from '@contexts/plant-species/application/queries/plant-species-find-by-id/plant-species-find-by-id.query';
import { SkipSpace } from '@shared/decorators/skip-space.decorator';

import { PlantSpeciesFindByCriteriaRequestDto } from '../dtos/requests/plant-species-find-by-criteria.request.dto';
import { PlantSpeciesFindByIdRequestDto } from '../dtos/requests/plant-species-find-by-id.request.dto';
import {
  PaginatedPlantSpeciesResultDto,
  PlantSpeciesResponseDto,
} from '../dtos/responses/plant-species.response.dto';
import { PlantSpeciesGraphQLMapper } from '../mappers/plant-species.mapper';

@Resolver()
@SkipSpace()
@UseGuards(JwtAuthGuard)
export class PlantSpeciesQueriesResolver {
  private readonly logger = new Logger(PlantSpeciesQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly plantSpeciesGraphQLMapper: PlantSpeciesGraphQLMapper,
  ) {}

  @Query(() => PlantSpeciesResponseDto)
  async plantSpecies(
    @Args('input') input: PlantSpeciesFindByIdRequestDto,
  ): Promise<PlantSpeciesResponseDto> {
    this.logger.log(`Finding plant species by id: ${input.id}`);

    const result = await this.queryBus.execute(
      new PlantSpeciesFindByIdQuery({ plantSpeciesId: input.id }),
    );

    return this.plantSpeciesGraphQLMapper.toResponseDtoFromViewModel(result);
  }

  @Query(() => PaginatedPlantSpeciesResultDto)
  async plantSpeciesList(
    @Args('input', { nullable: true })
    input?: PlantSpeciesFindByCriteriaRequestDto,
  ): Promise<PaginatedPlantSpeciesResultDto> {
    this.logger.log(
      `Finding plant species by criteria: ${JSON.stringify(input)}`,
    );

    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );

    const result = await this.queryBus.execute(
      new PlantSpeciesFindByCriteriaQuery({ criteria }),
    );

    return this.plantSpeciesGraphQLMapper.toPaginatedResponseDto(result);
  }
}
