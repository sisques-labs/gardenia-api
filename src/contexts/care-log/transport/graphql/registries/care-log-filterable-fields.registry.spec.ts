import { FilterOperator, FilterValidationPipe } from '@sisques-labs/nestjs-kit';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogQueryableField } from '@contexts/care-log/transport/graphql/enums/care-log-queryable-field.enum';
import { careLogFilterableFields } from '@contexts/care-log/transport/graphql/registries/care-log-filterable-fields.registry';

describe('careLogFilterableFields', () => {
  const pipe = new FilterValidationPipe(careLogFilterableFields);

  it('has an entry for every CareLogQueryableField value', () => {
    for (const field of Object.values(CareLogQueryableField)) {
      expect(careLogFilterableFields[field]).toBeDefined();
    }
  });

  it('accepts an IN filter on activityType with real enum values', () => {
    const input = {
      filters: [
        {
          field: CareLogQueryableField.ACTIVITY_TYPE,
          operator: FilterOperator.IN,
          value: [
            CareLogActivityTypeEnum.WATERING,
            CareLogActivityTypeEnum.PRUNING,
          ],
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('rejects an activityType value outside the enum', () => {
    const input = {
      filters: [
        {
          field: CareLogQueryableField.ACTIVITY_TYPE,
          operator: FilterOperator.EQUALS,
          value: 'DANCING',
        },
      ],
    };

    expect(() => pipe.transform(input)).toThrow(/expected one of/);
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
