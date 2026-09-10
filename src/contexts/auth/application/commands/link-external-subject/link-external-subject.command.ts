import { AccountEmailValueObject } from '@contexts/auth/domain/value-objects/account-email/account-email.vo';
import { ExternalSubjectValueObject } from '@contexts/auth/domain/value-objects/external-subject/external-subject.vo';

export interface LinkExternalSubjectCommandInput {
  email: string;
  externalSubject: string;
}

export class LinkExternalSubjectCommand {
  public readonly email: AccountEmailValueObject;
  public readonly externalSubject: ExternalSubjectValueObject;

  constructor(input: LinkExternalSubjectCommandInput) {
    this.email = new AccountEmailValueObject(input.email);
    this.externalSubject = new ExternalSubjectValueObject(
      input.externalSubject,
    );
  }
}
