import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  FILE_READ_REPOSITORY,
  IFileReadRepository,
} from '@contexts/files/domain/repositories/read/file-read.repository';
import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';

import { FileFindByCriteriaQuery } from './file-find-by-criteria.query';

@QueryHandler(FileFindByCriteriaQuery)
export class FileFindByCriteriaQueryHandler implements IQueryHandler<
  FileFindByCriteriaQuery,
  PaginatedResult<FileViewModel>
> {
  private readonly logger = new Logger(FileFindByCriteriaQueryHandler.name);

  constructor(
    @Inject(FILE_READ_REPOSITORY)
    private readonly fileReadRepository: IFileReadRepository,
  ) {}

  async execute(
    query: FileFindByCriteriaQuery,
  ): Promise<PaginatedResult<FileViewModel>> {
    this.logger.log('Executing FileFindByCriteriaQuery');
    return this.fileReadRepository.findByCriteria(query.criteria);
  }
}
