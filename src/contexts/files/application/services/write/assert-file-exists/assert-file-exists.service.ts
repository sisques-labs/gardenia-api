import { Inject, Injectable } from '@nestjs/common';

import { FileAggregate } from '@contexts/files/domain/aggregates/file.aggregate';
import { FileNotFoundException } from '@contexts/files/domain/exceptions/file-not-found.exception';
import {
  FILE_WRITE_REPOSITORY,
  IFileWriteRepository,
} from '@contexts/files/domain/repositories/write/file-write.repository';
import { FileIdValueObject } from '@contexts/files/domain/value-objects/file-id/file-id.value-object';

@Injectable()
export class AssertFileExistsService {
  constructor(
    @Inject(FILE_WRITE_REPOSITORY)
    private readonly fileWriteRepository: IFileWriteRepository,
  ) {}

  async execute(id: FileIdValueObject): Promise<FileAggregate> {
    const file = await this.fileWriteRepository.findById(id.value);
    if (!file) throw new FileNotFoundException(id.value);
    return file;
  }
}
