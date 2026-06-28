import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  FILE_STORAGE_PORT,
  IFileStoragePort,
} from '@contexts/files/application/ports/file-storage.port';
import { AssertFileViewModelExistsService } from '@contexts/files/application/services/read/assert-file-view-model-exists/assert-file-view-model-exists.service';
import { FileNotFoundException } from '@contexts/files/domain/exceptions/file-not-found.exception';

import { FileFindContentByIdQuery } from './file-find-content-by-id.query';
import { FileContentResult } from './file-find-content-by-id.result';

@QueryHandler(FileFindContentByIdQuery)
export class FileFindContentByIdQueryHandler implements IQueryHandler<
  FileFindContentByIdQuery,
  FileContentResult
> {
  private readonly logger = new Logger(FileFindContentByIdQueryHandler.name);

  constructor(
    private readonly assertFileViewModelExistsService: AssertFileViewModelExistsService,
    @Inject(FILE_STORAGE_PORT)
    private readonly fileStoragePort: IFileStoragePort,
  ) {}

  async execute(query: FileFindContentByIdQuery): Promise<FileContentResult> {
    this.logger.log(
      `Executing FileFindContentByIdQuery for file ${query.id.value}`,
    );

    // Tenant-scoped metadata lookup: 404 if the file is absent in this space.
    const file = await this.assertFileViewModelExistsService.execute(query.id);

    const bytes = await this.fileStoragePort.read(file.storageKey);
    if (!bytes) throw new FileNotFoundException(query.id.value);

    return { bytes, mimeType: file.mimeType, filename: file.filename };
  }
}
