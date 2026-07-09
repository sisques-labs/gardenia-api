import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Criteria } from '@sisques-labs/nestjs-kit';
import { FilterValidationPipe } from '@sisques-labs/nestjs-kit/graphql';

import { PlantPhotoFindByCriteriaQuery } from '@contexts/plant-photos/application/queries/plant-photo-find-by-criteria/plant-photo-find-by-criteria.query';
import { PlantPhotoFindByIdQuery } from '@contexts/plant-photos/application/queries/plant-photo-find-by-id/plant-photo-find-by-id.query';
import { plantPhotoFilterableFields } from '@contexts/plant-photos/transport/graphql/registries/plant-photo-filterable-fields.registry';
import { PlantPhotoFindByCriteriaRequestDto } from '@contexts/plant-photos/transport/graphql/dtos/requests/plant-photo-find-by-criteria.request.dto';
import { PlantPhotoFindByIdRequestDto } from '@contexts/plant-photos/transport/graphql/dtos/requests/plant-photo-find-by-id.request.dto';
import {
  PaginatedPlantPhotoResultDto,
  PlantPhotoResponseDto,
} from '@contexts/plant-photos/transport/graphql/dtos/responses/plant-photo.response.dto';
import { PlantPhotoGraphQLMapper } from '@contexts/plant-photos/transport/graphql/mappers/plant-photo/plant-photo.mapper';

@Resolver()
export class PlantPhotoQueriesResolver {
  private readonly logger = new Logger(PlantPhotoQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly plantPhotoGraphQLMapper: PlantPhotoGraphQLMapper,
  ) {}

  @Query(() => PaginatedPlantPhotoResultDto)
  async plantPhotosFindByCriteria(
    @Args(
      'input',
      { nullable: true },
      new FilterValidationPipe(plantPhotoFilterableFields),
    )
    input?: PlantPhotoFindByCriteriaRequestDto,
  ): Promise<PaginatedPlantPhotoResultDto> {
    this.logger.log(
      `Finding plant photos by criteria: ${JSON.stringify(input)}`,
    );

    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );

    const result = await this.queryBus.execute(
      new PlantPhotoFindByCriteriaQuery(criteria),
    );

    return this.plantPhotoGraphQLMapper.toPaginatedResponseDto(result);
  }

  @Query(() => PlantPhotoResponseDto, { nullable: true })
  async plantPhotoFindById(
    @Args('input') input: PlantPhotoFindByIdRequestDto,
  ): Promise<PlantPhotoResponseDto | null> {
    this.logger.log(`Finding plant photo by id: ${input.id}`);

    const result = await this.queryBus.execute(
      new PlantPhotoFindByIdQuery({ id: input.id }),
    );

    return result ? this.plantPhotoGraphQLMapper.toResponseDto(result) : null;
  }
}
