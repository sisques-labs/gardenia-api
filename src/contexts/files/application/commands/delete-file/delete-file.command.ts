import { FileIdValueObject } from '@contexts/files/domain/value-objects/file-id/file-id.value-object';

export type DeleteFileCommandInput = {
  id: string;
};

export class DeleteFileCommand {
  public readonly id: FileIdValueObject;

  constructor(input: DeleteFileCommandInput) {
    this.id = new FileIdValueObject(input.id);
  }
}
