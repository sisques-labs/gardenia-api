import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type DeleteHarvestCommandInput = {
  id: string;
};

export class DeleteHarvestCommand {
  public readonly id: UuidValueObject;

  constructor(input: DeleteHarvestCommandInput) {
    this.id = new UuidValueObject(input.id);
  }
}
