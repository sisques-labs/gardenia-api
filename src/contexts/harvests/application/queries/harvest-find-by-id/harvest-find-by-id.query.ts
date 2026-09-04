import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type HarvestFindByIdQueryInput = {
  id: string;
};

export class HarvestFindByIdQuery {
  public readonly id: UuidValueObject;

  constructor(input: HarvestFindByIdQueryInput) {
    this.id = new UuidValueObject(input.id);
  }
}
