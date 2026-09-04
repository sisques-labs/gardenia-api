import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type FileFindByIdQueryInput = {
  id: string;
};

export class FileFindByIdQuery {
  public readonly id: UuidValueObject;

  constructor(input: FileFindByIdQueryInput) {
    this.id = new UuidValueObject(input.id);
  }
}
