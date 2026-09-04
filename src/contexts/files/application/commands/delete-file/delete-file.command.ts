import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type DeleteFileCommandInput = {
  id: string;
};

export class DeleteFileCommand {
  public readonly id: UuidValueObject;

  constructor(input: DeleteFileCommandInput) {
    this.id = new UuidValueObject(input.id);
  }
}
