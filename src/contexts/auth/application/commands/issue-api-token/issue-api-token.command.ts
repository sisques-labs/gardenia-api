import { ApiTokenLabelValueObject } from '@contexts/auth/domain/value-objects/api-token-label/api-token-label.vo';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface IssueApiTokenCommandInput {
  userId: string;
  spaceId: string;
  label: string;
}

export class IssueApiTokenCommand {
  public readonly userId: UuidValueObject;
  public readonly spaceId: UuidValueObject;
  public readonly label: ApiTokenLabelValueObject;

  constructor(input: IssueApiTokenCommandInput) {
    this.userId = new UuidValueObject(input.userId);
    this.spaceId = new UuidValueObject(input.spaceId);
    this.label = new ApiTokenLabelValueObject(input.label);
  }
}
