import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface DeleteInventoryItemsBulkCommandInput {
  ids: string[];
}

export class DeleteInventoryItemsBulkCommand {
  public readonly ids: UuidValueObject[];

  constructor(input: DeleteInventoryItemsBulkCommandInput) {
    this.ids = [...new Set(input.ids)].map((id) => new UuidValueObject(id));
  }
}
