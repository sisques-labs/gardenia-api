import { HarvestIdValueObject } from '@contexts/harvests/domain/value-objects/harvest-id/harvest-id.value-object';

export type HarvestFindByIdQueryInput = {
  id: string;
};

export class HarvestFindByIdQuery {
  public readonly id: HarvestIdValueObject;

  constructor(input: HarvestFindByIdQueryInput) {
    this.id = new HarvestIdValueObject(input.id);
  }
}
