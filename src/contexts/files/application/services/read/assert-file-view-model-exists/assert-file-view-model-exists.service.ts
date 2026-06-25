import { Inject, Injectable } from '@nestjs/common';

import { FileNotFoundException } from '@contexts/files/domain/exceptions/file-not-found.exception';
import {
  FILE_READ_REPOSITORY,
  IFileReadRepository,
} from '@contexts/files/domain/repositories/read/file-read.repository';
import { FileIdValueObject } from '@contexts/files/domain/value-objects/file-id/file-id.value-object';
import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';

@Injectable()
export class AssertFileViewModelExistsService {
  constructor(
    @Inject(FILE_READ_REPOSITORY)
    private readonly fileReadRepository: IFileReadRepository,
  ) {}

  async execute(id: FileIdValueObject): Promise<FileViewModel> {
    const file = await this.fileReadRepository.findById(id.value);
    if (!file) throw new FileNotFoundException(id.value);
    return file;
  }
}
