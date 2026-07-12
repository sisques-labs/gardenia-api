import { FilterOperator } from '@sisques-labs/nestjs-kit';
import { FilterValidationPipe } from '@sisques-labs/nestjs-kit/graphql';

import { BridgeStatusEnum } from '@contexts/nodes/domain/enums/bridge-status.enum';
import { BridgeQueryableField } from '@contexts/nodes/transport/graphql/enums/bridge-queryable-field.enum';
import { bridgeFilterableFields } from '@contexts/nodes/transport/graphql/registries/bridge-filterable-fields.registry';

describe('bridgeFilterableFields', () => {
  const pipe = new FilterValidationPipe(bridgeFilterableFields);

  it('has an entry for every BridgeQueryableField value', () => {
    for (const field of Object.values(BridgeQueryableField)) {
      expect(bridgeFilterableFields[field]).toBeDefined();
    }
  });

  it('accepts an EQUALS filter on status with a valid enum value', () => {
    const input = {
      filters: [
        {
          field: BridgeQueryableField.STATUS,
          operator: FilterOperator.EQUALS,
          value: BridgeStatusEnum.ACTIVE,
        },
      ],
    };
    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('rejects an invalid enum value on status', () => {
    const input = {
      filters: [
        {
          field: BridgeQueryableField.STATUS,
          operator: FilterOperator.EQUALS,
          value: 'NOT_A_STATUS',
        },
      ],
    };
    expect(() => pipe.transform(input)).toThrow();
  });

  it('rejects a filter on a field outside the whitelist (spaceId)', () => {
    const input = {
      filters: [
        { field: 'spaceId', operator: FilterOperator.EQUALS, value: 'x' },
      ],
    };
    expect(() => pipe.transform(input)).toThrow(/Unknown filter field/);
  });
});
