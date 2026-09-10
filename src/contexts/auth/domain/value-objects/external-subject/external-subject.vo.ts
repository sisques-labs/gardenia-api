import { StringValueObject } from '@sisques-labs/nestjs-kit';

/**
 * Platform (Sisques Account) subject id (`sub` claim). Globally unique across
 * `accounts` once linked — see `accounts.external_subject` migration.
 */
export class ExternalSubjectValueObject extends StringValueObject {
  constructor(value: string) {
    super(value, { allowEmpty: false });
  }
}
