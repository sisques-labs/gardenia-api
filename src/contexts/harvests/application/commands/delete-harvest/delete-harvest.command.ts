import { HarvestIdValueObject } from '@contexts/harvests/domain/value-objects/harvest-id/harvest-id.value-object';

export type DeleteHarvestCommandInput = {
  id: string;
};

export class DeleteHarvestCommand {
  public readonly id: HarvestIdValueObject;

  constructor(input: DeleteHarvestCommandInput) {
    this.id = new HarvestIdValueObject(input.id);
  }
}
