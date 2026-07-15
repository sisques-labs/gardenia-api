import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AssertFileViewModelExistsService } from '@contexts/files/application/services/read/assert-file-view-model-exists/assert-file-view-model-exists.service';
import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';

import { FileFindByIdQuery } from './file-find-by-id.query';

@QueryHandler(FileFindByIdQuery)
export class FileFindByIdQueryHandler implements IQueryHandler<
  FileFindByIdQuery,
  FileViewModel
> {
  private readonly logger = new Logger(FileFindByIdQueryHandler.name);

  constructor(
    private readonly assertFileViewModelExistsService: AssertFileViewModelExistsService,
  ) {}

  async execute(query: FileFindByIdQuery): Promise<FileViewModel> {
    this.logger.log(`Executing FileFindByIdQuery for file ${query.id.value}`);
    return this.assertFileViewModelExistsService.execute(query.id);
  }
}
