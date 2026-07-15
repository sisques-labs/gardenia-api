import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';

export const FILE_READ_REPOSITORY = Symbol('FILE_READ_REPOSITORY');

export type IFileReadRepository = IBaseReadRepository<FileViewModel>;
