import { FilterOperator, FilterValidationPipe } from '@sisques-labs/nestjs-kit';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleQueryableField } from '@contexts/care-schedule/transport/graphql/enums/care-schedule-queryable-field.enum';
import { careScheduleFilterableFields } from '@contexts/care-schedule/transport/graphql/registries/care-schedule-filterable-fields.registry';

describe('careScheduleFilterableFields', () => {
  const pipe = new FilterValidationPipe(careScheduleFilterableFields);

  it('has an entry for every CareScheduleQueryableField value', () => {
    for (const field of Object.values(CareScheduleQueryableField)) {
      expect(careScheduleFilterableFields[field]).toBeDefined();
    }
  });

  it('accepts an EQUALS filter on activityType with a real enum value', () => {
    const input = {
      filters: [
        {
          field: CareScheduleQueryableField.ACTIVITY_TYPE,
          operator: FilterOperator.EQUALS,
          value: CareScheduleActivityTypeEnum.WATERING,
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('rejects an activityType value outside the enum', () => {
    const input = {
      filters: [
        {
          field: CareScheduleQueryableField.ACTIVITY_TYPE,
          operator: FilterOperator.EQUALS,
          value: 'DANCING',
        },
      ],
    };

    expect(() => pipe.transform(input)).toThrow(/expected one of/);
  });

  it('accepts the virtual due_before date filter', () => {
    const input = {
      filters: [
        {
          field: CareScheduleQueryableField.DUE_BEFORE,
          operator: FilterOperator.LESS_THAN_OR_EQUAL,
          value: '2026-01-01T00:00:00.000Z',
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('accepts a boolean value for active', () => {
    const input = {
      filters: [
        {
          field: CareScheduleQueryableField.ACTIVE,
          operator: FilterOperator.EQUALS,
          value: true,
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('rejects a filter on a field outside the whitelist (e.g. spaceId)', () => {
    const input = {
      filters: [
        { field: 'spaceId', operator: FilterOperator.EQUALS, value: 'x' },
      ],
    };

    expect(() => pipe.transform(input)).toThrow(/Unknown filter field/);
  });
});
