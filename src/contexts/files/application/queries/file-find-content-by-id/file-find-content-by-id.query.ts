import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type FileFindContentByIdQueryInput = {
  id: string;
};

export class FileFindContentByIdQuery {
  public readonly id: UuidValueObject;

  constructor(input: FileFindContentByIdQueryInput) {
    this.id = new UuidValueObject(input.id);
  }
}
