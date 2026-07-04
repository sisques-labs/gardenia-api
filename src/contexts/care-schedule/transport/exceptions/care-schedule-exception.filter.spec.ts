import { HttpStatus } from '@nestjs/common';

import { CareScheduleNotFoundException } from '@contexts/care-schedule/domain/exceptions/care-schedule-not-found.exception';
import { resolveCareScheduleExceptionStatus } from './care-schedule-exception.filter';

class UnknownException extends Error {}

describe('resolveCareScheduleExceptionStatus', () => {
  it('maps CareScheduleNotFoundException to 404', () => {
    const exception = new CareScheduleNotFoundException('some-id');

    expect(resolveCareScheduleExceptionStatus(exception)).toBe(
      HttpStatus.NOT_FOUND,
    );
  });

  it('returns null for an unmapped exception', () => {
    const exception = new UnknownException('boom') as any;

    expect(resolveCareScheduleExceptionStatus(exception)).toBeNull();
  });
});
