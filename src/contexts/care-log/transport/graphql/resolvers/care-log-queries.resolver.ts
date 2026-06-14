import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { CareLogFindByCriteriaQuery } from '@contexts/care-log/application/queries/care-log-find-by-criteria/care-log-find-by-criteria.query';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
import { AssertCareLogEntryViewModelExistsService } from '@contexts/care-log/application/services/read/assert-care-log-entry-view-model-exists/assert-care-log-entry-view-model-exists.service';

import { CareLogFindByCriteriaGraphQLDto } from '../dtos/requests/care-log-find-by-criteria-graphql.dto';
import {
  CareLogEntryResponseDto,
  PaginatedCareLogEntryResultDto,
} from '../dtos/responses/care-log-entry.response.dto';
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

  @Query(() => PaginatedCareLogEntryResultDto)
  async careLogFindByCriteria(
    @Args('input', { nullable: true }) input?: CareLogFindByCriteriaGraphQLDto,
  ): Promise<PaginatedCareLogEntryResultDto> {
    this.logger.log('Finding care log entries by criteria');

    const criteria = new Criteria(
      input?.filters,
      input?.sorts,
      input?.pagination,
    );

    const result = await this.queryBus.execute<
      CareLogFindByCriteriaQuery,
      PaginatedResult<CareLogEntryViewModel>
    >(new CareLogFindByCriteriaQuery({ criteria }));

    return {
      items: result.items.map((vm) =>
        this.careLogGraphQLMapper.toResponseDto(vm),
      ),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    };
  }
}
