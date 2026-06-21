import { StringValueObject } from '@sisques-labs/nestjs-kit';

import { InvalidApiTokenLabelException } from '@contexts/auth/domain/exceptions/invalid-api-token-label.exception';

const MAX_LABEL_LENGTH = 100;

/** Human-readable name for an API token (e.g. "Home Assistant"). */
export class ApiTokenLabelValueObject extends StringValueObject {
  constructor(value: string) {
    super(value);
    const trimmed = value?.trim() ?? '';
    if (trimmed.length === 0 || trimmed.length > MAX_LABEL_LENGTH) {
      throw new InvalidApiTokenLabelException();
    }
  }
}
