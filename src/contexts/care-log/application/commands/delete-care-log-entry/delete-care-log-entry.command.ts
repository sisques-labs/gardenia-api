import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { ICareLogEntryPrimitives } from '@contexts/care-log/domain/primitives/care-log-entry.primitives';

export type DeleteCareLogEntryCommandInput = Pick<
  ICareLogEntryPrimitives,
  'id'
> & {
  requestingUserId: string;
};

export class DeleteCareLogEntryCommand {
  public readonly id: UuidValueObject;
  public readonly requestingUserId: UuidValueObject;

  constructor(input: DeleteCareLogEntryCommandInput) {
    this.id = new UuidValueObject(input.id);
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
  }
}
