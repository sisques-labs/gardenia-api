import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { FileAggregate } from '@contexts/files/domain/aggregates/file.aggregate';

export const FILE_WRITE_REPOSITORY = Symbol('FILE_WRITE_REPOSITORY');

export type IFileWriteRepository = IBaseWriteRepository<FileAggregate>;
