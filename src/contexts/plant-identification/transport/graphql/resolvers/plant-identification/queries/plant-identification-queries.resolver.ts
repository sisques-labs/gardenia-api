import { Logger, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Criteria } from '@sisques-labs/nestjs-kit';
import { FilterValidationPipe } from '@sisques-labs/nestjs-kit/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { PlantIdentificationFindByCriteriaQuery } from '@contexts/plant-identification/application/queries/plant-identification-find-by-criteria/plant-identification-find-by-criteria.query';
import { PlantIdentificationFindByIdQuery } from '@contexts/plant-identification/application/queries/plant-identification-find-by-id/plant-identification-find-by-id.query';
import { plantIdentificationFilterableFields } from '@contexts/plant-identification/transport/graphql/registries/plant-identification-filterable-fields.registry';
import { PlantIdentificationFindByCriteriaRequestDto } from '@contexts/plant-identification/transport/graphql/dtos/requests/plant-identification-find-by-criteria.request.dto';
import { PlantIdentificationFindByIdRequestDto } from '@contexts/plant-identification/transport/graphql/dtos/requests/plant-identification-find-by-id.request.dto';
import {
  PaginatedPlantIdentificationResultDto,
  PlantIdentificationResponseDto,
} from '@contexts/plant-identification/transport/graphql/dtos/responses/plant-identification.response.dto';
import { PlantIdentificationGraphQLMapper } from '@contexts/plant-identification/transport/graphql/mappers/plant-identification/plant-identification.mapper';

@UseGuards(JwtAuthGuard)
@Resolver()
export class PlantIdentificationQueriesResolver {
  private readonly logger = new Logger(PlantIdentificationQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly plantIdentificationGraphQLMapper: PlantIdentificationGraphQLMapper,
  ) {}

  @Query(() => PaginatedPlantIdentificationResultDto)
  async plantIdentificationsFindByCriteria(
    @Args(
      'input',
      { nullable: true },
      new FilterValidationPipe(plantIdentificationFilterableFields),
    )
    input?: PlantIdentificationFindByCriteriaRequestDto,
  ): Promise<PaginatedPlantIdentificationResultDto> {
    this.logger.log(
      `Finding plant identifications by criteria: ${JSON.stringify(input)}`,
    );

    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );

    const result = await this.queryBus.execute(
      new PlantIdentificationFindByCriteriaQuery(criteria),
    );

    return this.plantIdentificationGraphQLMapper.toPaginatedResponseDto(result);
  }

  @Query(() => PlantIdentificationResponseDto, { nullable: true })
  async plantIdentificationFindById(
    @Args('input') input: PlantIdentificationFindByIdRequestDto,
  ): Promise<PlantIdentificationResponseDto | null> {
    this.logger.log(`Finding plant identification by id: ${input.id}`);

    const result = await this.queryBus.execute(
      new PlantIdentificationFindByIdQuery({ id: input.id }),
    );

    return result
      ? this.plantIdentificationGraphQLMapper.toResponseDto(result)
      : null;
  }
}
