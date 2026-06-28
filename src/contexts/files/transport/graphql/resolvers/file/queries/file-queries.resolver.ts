import { Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Args, Query, Resolver } from '@nestjs/graphql';
import {
  Criteria,
  Filter,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';

import { FileFindByCriteriaQuery } from '@contexts/files/application/queries/file-find-by-criteria/file-find-by-criteria.query';
import { FileFindByIdQuery } from '@contexts/files/application/queries/file-find-by-id/file-find-by-id.query';
import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';
import { FileFindByCriteriaRequestDto } from '@contexts/files/transport/graphql/dtos/requests/file-find-by-criteria.request.dto';
import { FileFindByIdRequestDto } from '@contexts/files/transport/graphql/dtos/requests/file-find-by-id.request.dto';
import {
  FileResponseDto,
  PaginatedFileResultDto,
} from '@contexts/files/transport/graphql/dtos/responses/file.response.dto';
import { FileGraphQLMapper } from '@contexts/files/transport/graphql/mappers/file/file.mapper';

@Resolver()
export class FileQueriesResolver {
  private readonly logger = new Logger(FileQueriesResolver.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly fileGraphQLMapper: FileGraphQLMapper,
  ) {}

  @Query(() => PaginatedFileResultDto)
  async filesFindByCriteria(
    @Args('input', { nullable: true })
    input?: FileFindByCriteriaRequestDto,
  ): Promise<PaginatedFileResultDto> {
    this.logger.log(`Finding files by criteria: ${JSON.stringify(input)}`);

    const filters: Filter[] = [];
    if (input?.mimeType)
      filters.push({
        field: 'mime_type',
        operator: FilterOperator.EQUALS,
        value: input.mimeType,
      });
    if (input?.filename)
      filters.push({
        field: 'filename',
        operator: FilterOperator.LIKE,
        value: input.filename,
      });

    const pagination =
      input?.page || input?.limit
        ? { page: input?.page ?? 1, perPage: input?.limit ?? 20 }
        : undefined;

    const result = await this.queryBus.execute<
      FileFindByCriteriaQuery,
      PaginatedResult<FileViewModel>
    >(
      new FileFindByCriteriaQuery(new Criteria(filters, undefined, pagination)),
    );

    return this.fileGraphQLMapper.toPaginatedResponseDto(result);
  }

  @Query(() => FileResponseDto, { nullable: true })
  async fileFindById(
    @Args('input') input: FileFindByIdRequestDto,
  ): Promise<FileResponseDto | null> {
    this.logger.log(`Finding file by id: ${input.id}`);

    const result = await this.queryBus.execute<
      FileFindByIdQuery,
      FileViewModel
    >(new FileFindByIdQuery({ id: input.id }));

    return result ? this.fileGraphQLMapper.toResponseDto(result) : null;
  }
}
