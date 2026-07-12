import { FilterOperator } from '@sisques-labs/nestjs-kit';
import { FilterValidationPipe } from '@sisques-labs/nestjs-kit/graphql';

import { NodeStatusEnum } from '@contexts/nodes/domain/enums/node-status.enum';
import { NodeQueryableField } from '@contexts/nodes/transport/graphql/enums/node-queryable-field.enum';
import { nodeFilterableFields } from '@contexts/nodes/transport/graphql/registries/node-filterable-fields.registry';

describe('nodeFilterableFields', () => {
  const pipe = new FilterValidationPipe(nodeFilterableFields);

  it('has an entry for every NodeQueryableField value', () => {
    for (const field of Object.values(NodeQueryableField)) {
      expect(nodeFilterableFields[field]).toBeDefined();
    }
  });

  it('accepts an EQUALS filter on status with a valid enum value', () => {
    const input = {
      filters: [
        {
          field: NodeQueryableField.STATUS,
          operator: FilterOperator.EQUALS,
          value: NodeStatusEnum.ONLINE,
        },
      ],
    };
    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('accepts an EQUALS filter on bridgeId with a uuid string', () => {
    const input = {
      filters: [
        {
          field: NodeQueryableField.BRIDGE_ID,
          operator: FilterOperator.EQUALS,
          value: 'a3f1b2c4-0000-4000-8000-000000000000',
        },
      ],
    };
    expect(() => pipe.transform(input)).not.toThrow();
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
