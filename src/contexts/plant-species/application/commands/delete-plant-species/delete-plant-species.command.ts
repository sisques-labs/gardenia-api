import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface DeletePlantSpeciesCommandInput {
  id: string;
}

export class DeletePlantSpeciesCommand {
  public readonly id: UuidValueObject;

  constructor(input: DeletePlantSpeciesCommandInput) {
    this.id = new UuidValueObject(input.id);
  }
}
