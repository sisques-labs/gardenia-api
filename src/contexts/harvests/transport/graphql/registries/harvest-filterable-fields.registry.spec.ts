import { FilterOperator, FilterValidationPipe } from '@sisques-labs/nestjs-kit';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestQueryableField } from '@contexts/harvests/transport/graphql/enums/harvest-queryable-field.enum';
import { harvestFilterableFields } from '@contexts/harvests/transport/graphql/registries/harvest-filterable-fields.registry';

describe('harvestFilterableFields', () => {
  const pipe = new FilterValidationPipe(harvestFilterableFields);

  it('has an entry for every HarvestQueryableField value', () => {
    for (const field of Object.values(HarvestQueryableField)) {
      expect(harvestFilterableFields[field]).toBeDefined();
    }
  });

  it('accepts an EQUALS filter on unit with a real HarvestUnitEnum value', () => {
    const input = {
      filters: [
        {
          field: HarvestQueryableField.UNIT,
          operator: FilterOperator.EQUALS,
          value: HarvestUnitEnum.KG,
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('rejects a unit value outside HarvestUnitEnum', () => {
    const input = {
      filters: [
        {
          field: HarvestQueryableField.UNIT,
          operator: FilterOperator.EQUALS,
          value: 'TONS',
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
