import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { CareLogIdValueObject } from '@contexts/care-log/domain/value-objects/care-log-id/care-log-id.value-object';

export interface DeleteCareLogEntryCommandInput {
  id: string;
  requestingUserId: string;
}

export class DeleteCareLogEntryCommand {
  public readonly id: CareLogIdValueObject;
  public readonly requestingUserId: UuidValueObject;

  constructor(input: DeleteCareLogEntryCommandInput) {
    this.id = new CareLogIdValueObject(input.id);
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
  }
}
