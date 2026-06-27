import { FileIdValueObject } from '@contexts/files/domain/value-objects/file-id/file-id.value-object';

export type FileFindByIdQueryInput = {
  id: string;
};

export class FileFindByIdQuery {
  public readonly id: FileIdValueObject;

  constructor(input: FileFindByIdQueryInput) {
    this.id = new FileIdValueObject(input.id);
  }
}
