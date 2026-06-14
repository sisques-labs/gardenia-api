import { CareLogPerformedAtInvalidException } from '@contexts/care-log/domain/exceptions/care-log-performed-at-invalid.exception';

import { CareLogPerformedAtValueObject } from './care-log-performed-at.value-object';

describe('CareLogPerformedAtValueObject', () => {
  it('should not throw for a valid past date', () => {
    const past = new Date('2020-01-01T00:00:00.000Z');
    expect(() => new CareLogPerformedAtValueObject(past)).not.toThrow();
  });

  it('should throw CareLogPerformedAtInvalidException for a future date', () => {
    const future = new Date(Date.now() + 60_000);
    expect(() => new CareLogPerformedAtValueObject(future)).toThrow(
      CareLogPerformedAtInvalidException,
    );
  });
});
