import { FileIdValueObject } from '@contexts/files/domain/value-objects/file-id/file-id.value-object';

export type FileFindContentByIdQueryInput = {
  id: string;
};

export class FileFindContentByIdQuery {
  public readonly id: FileIdValueObject;

  constructor(input: FileFindContentByIdQueryInput) {
    this.id = new FileIdValueObject(input.id);
  }
}
