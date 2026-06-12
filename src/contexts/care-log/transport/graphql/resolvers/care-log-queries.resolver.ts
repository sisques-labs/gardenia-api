import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';

import { CareLogFindByPlantQuery } from '@contexts/care-log/application/queries/care-log-find-by-plant/care-log-find-by-plant.query';
import { CareLogFindBySpaceQuery } from '@contexts/care-log/application/queries/care-log-find-by-space/care-log-find-by-space.query';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
import { AssertCareLogEntryViewModelExistsService } from '@contexts/care-log/application/services/read/assert-care-log-entry-view-model-exists/assert-care-log-entry-view-model-exists.service';

import { CareLogFindBySpaceGraphQLDto } from '../dtos/requests/care-log-find-by-space-graphql.dto';
import { CareLogEntryResponseDto } from '../dtos/responses/care-log-entry.response.dto';
import { CareLogGraphQLMapper } from '../mappers/care-log/care-log.mapper';

@Resolver(() => CareLogEntryResponseDto)
export class CareLogQueriesResolver {
  private readonly logger = new Logger(CareLogQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly careLogGraphQLMapper: CareLogGraphQLMapper,
    private readonly assertViewModelExists: AssertCareLogEntryViewModelExistsService,
  ) {}

  @Query(() => CareLogEntryResponseDto, { nullable: true })
  async careLogFindById(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<CareLogEntryResponseDto | null> {
    this.logger.log(`Finding care log entry: ${id}`);

    const vm = await this.assertViewModelExists.execute(id);
    return this.careLogGraphQLMapper.toResponseDto(vm);
  }

  @Query(() => [CareLogEntryResponseDto])
  async careLogEntriesByPlant(
    @Args('plantId', { type: () => ID }) plantId: string,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<CareLogEntryResponseDto[]> {
    this.logger.log(`Listing care log entries for plant: ${plantId}`);

    const entries = await this.queryBus.execute<
      CareLogFindByPlantQuery,
      CareLogEntryViewModel[]
    >(new CareLogFindByPlantQuery({ plantId, page, limit }));

    return entries.map((vm) => this.careLogGraphQLMapper.toResponseDto(vm));
  }

  @Query(() => [CareLogEntryResponseDto])
  async careLogEntriesBySpace(
    @Args('input', { nullable: true }) input?: CareLogFindBySpaceGraphQLDto,
  ): Promise<CareLogEntryResponseDto[]> {
    this.logger.log('Listing care log entries by space');

    const entries = await this.queryBus.execute<
      CareLogFindBySpaceQuery,
      CareLogEntryViewModel[]
    >(
      new CareLogFindBySpaceQuery({
        activityTypes: input?.activityTypes,
        fromDate: input?.fromDate,
        toDate: input?.toDate,
        page: input?.page,
        limit: input?.limit,
      }),
    );

    return entries.map((vm) => this.careLogGraphQLMapper.toResponseDto(vm));
  }
}
