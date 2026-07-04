import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Criteria, FilterValidationPipe } from '@sisques-labs/nestjs-kit';

import { CareScheduleFindByCriteriaQuery } from '@contexts/care-schedule/application/queries/care-schedule-find-by-criteria/care-schedule-find-by-criteria.query';
import { CareScheduleFindByIdQuery } from '@contexts/care-schedule/application/queries/care-schedule-find-by-id/care-schedule-find-by-id.query';
import { careScheduleFilterableFields } from '@contexts/care-schedule/transport/graphql/registries/care-schedule-filterable-fields.registry';
import { CareScheduleCriteriaGraphQLDto } from '@contexts/care-schedule/transport/graphql/dtos/requests/care-schedule-criteria-graphql.dto';
import { CareScheduleFindByIdGraphQLDto } from '@contexts/care-schedule/transport/graphql/dtos/requests/care-schedule-find-by-id-graphql.dto';
import {
  CareScheduleResponseDto,
  PaginatedCareSchedulesResultDto,
} from '@contexts/care-schedule/transport/graphql/dtos/responses/care-schedule.response.dto';
import { CareScheduleGraphQLMapper } from '@contexts/care-schedule/transport/graphql/mappers/care-schedule.mapper';

@Resolver()
export class CareScheduleQueriesResolver {
  private readonly logger = new Logger(CareScheduleQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly careScheduleGraphQLMapper: CareScheduleGraphQLMapper,
  ) {}

  @Query(() => PaginatedCareSchedulesResultDto)
  async careSchedulesFindByCriteria(
    @Args(
      'input',
      { nullable: true },
      new FilterValidationPipe(careScheduleFilterableFields),
    )
    input?: CareScheduleCriteriaGraphQLDto,
  ): Promise<PaginatedCareSchedulesResultDto> {
    this.logger.log(
      `Finding care schedules by criteria: ${JSON.stringify(input)}`,
    );

    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );

    const result = await this.queryBus.execute(
      new CareScheduleFindByCriteriaQuery(criteria),
    );

    return this.careScheduleGraphQLMapper.toPaginatedResponseDto(result);
  }

  @Query(() => CareScheduleResponseDto, { nullable: true })
  async careScheduleFindById(
    @Args('input') input: CareScheduleFindByIdGraphQLDto,
  ): Promise<CareScheduleResponseDto | null> {
    this.logger.log(`Finding care schedule by id: ${input.id}`);

    const result = await this.queryBus.execute(
      new CareScheduleFindByIdQuery({ id: input.id }),
    );

    return result ? this.careScheduleGraphQLMapper.toResponseDto(result) : null;
  }
}
