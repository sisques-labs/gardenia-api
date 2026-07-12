import { FilterOperator } from '@sisques-labs/nestjs-kit';
import { FilterValidationPipe } from '@sisques-labs/nestjs-kit/graphql';

import { SensorTypeEnum } from '@contexts/nodes/domain/enums/sensor-type.enum';
import { NodeTelemetryReadingQueryableField } from '@contexts/nodes/transport/graphql/enums/node-telemetry-reading-queryable-field.enum';
import { nodeTelemetryReadingFilterableFields } from '@contexts/nodes/transport/graphql/registries/node-telemetry-reading-filterable-fields.registry';

describe('nodeTelemetryReadingFilterableFields', () => {
  const pipe = new FilterValidationPipe(nodeTelemetryReadingFilterableFields);

  it('has an entry for every NodeTelemetryReadingQueryableField value', () => {
    for (const field of Object.values(NodeTelemetryReadingQueryableField)) {
      expect(nodeTelemetryReadingFilterableFields[field]).toBeDefined();
    }
  });

  it('accepts an EQUALS filter on sensorType with a valid enum value', () => {
    const input = {
      filters: [
        {
          field: NodeTelemetryReadingQueryableField.SENSOR_TYPE,
          operator: FilterOperator.EQUALS,
          value: SensorTypeEnum.SOIL_MOISTURE,
        },
      ],
    };
    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('rejects an invalid enum value on sensorType', () => {
    const input = {
      filters: [
        {
          field: NodeTelemetryReadingQueryableField.SENSOR_TYPE,
          operator: FilterOperator.EQUALS,
          value: 'NOT_A_SENSOR',
        },
      ],
    };
    expect(() => pipe.transform(input)).toThrow();
  });

  it('accepts a GREATER_THAN filter on value with a number', () => {
    const input = {
      filters: [
        {
          field: NodeTelemetryReadingQueryableField.VALUE,
          operator: FilterOperator.GREATER_THAN,
          value: 10,
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
